import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import db from "@/lib/prisma";

// Map environment variables from AUTH_* format to NEXTAUTH_* format
if (process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
}

if (process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.AUTH_URL;
}

// Debug: Log environment variables (without exposing secrets)
const debugEnv = () => {
  console.log('AUTH_DEBUG: Environment check');
  // Check both naming conventions
  console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('AUTH_GOOGLE_ID exists:', !!process.env.AUTH_GOOGLE_ID);
  console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
  console.log('AUTH_GOOGLE_SECRET exists:', !!process.env.AUTH_GOOGLE_SECRET);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('AUTH_URL:', process.env.AUTH_URL);
  console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  console.log('AUTH_SECRET exists:', !!process.env.AUTH_SECRET);
  
  // Generate a fallback secret if none exists
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('WARNING: NEXTAUTH_SECRET is not set. Using a fallback secret for development only.');
    // This is only for development - in production, always set NEXTAUTH_SECRET
    process.env.NEXTAUTH_SECRET = 'DEVELOPMENT_FALLBACK_SECRET_DO_NOT_USE_IN_PRODUCTION';
  }
};

debugEnv();

export const { signIn, signOut, auth, handlers } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      console.log('AUTH_DEBUG: Session callback', { 
        sessionExists: !!session, 
        tokenExists: !!token,
        sessionUser: session?.user ? true : false,
        tokenSub: token?.sub ? true : false
      });
      
      // Make sure to pass the token sub to the session
      if (token && session.user && token.sub) {
        session.user.id = token.sub;
      }
      
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('AUTH_DEBUG: JWT callback', { 
        tokenExists: !!token, 
        userExists: !!user,
        accountExists: !!account,
        tokenSub: token?.sub ? token.sub : 'no-sub'
      });
      
      // Initial sign in
      if (account && user) {
        console.log('AUTH_DEBUG: Initial sign in detected');
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }
      
      return token;
    }
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || 'DEVELOPMENT_FALLBACK_SECRET_DO_NOT_USE_IN_PRODUCTION',
});
