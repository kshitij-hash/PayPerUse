import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import db from "@/lib/prisma";

export const { signIn, signOut, auth, handlers } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
});
