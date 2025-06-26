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
  events: {
    async createUser({ user }) {
      try {
        // Create wallet for new user
        const response = await fetch(`${process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'}/api/create-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        const data = await response.json();
        if (data.success) {
          console.log('Wallet created for new user:', { userId: user.id, walletAddress: data.wallet.address });
        } else {
          console.error('Failed to create wallet for new user:', { userId: user.id, error: data.error });
        }
      } catch (error) {
        console.error('Error creating wallet for new user:', { userId: user.id, error });
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      // Make sure to pass the token sub to the session
      if (token && session.user && token.sub) {
        session.user.id = token.sub;
      }
      
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }
      
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'DEVELOPMENT_FALLBACK_SECRET_DO_NOT_USE_IN_PRODUCTION',
});
