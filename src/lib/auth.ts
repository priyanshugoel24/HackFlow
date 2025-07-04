import { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // ✅ use JWT instead of DB sessions
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7, // Optional: JWT valid for 7 days
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      // Add user profile info to token when user signs in
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // ✅ Add user ID from token to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider && user.email) {
        try {
          // Check if user already exists with this email
          const existingUser = await prisma.user.findFirst({
            where: { email: user.email },
            include: { accounts: true }
          });

          if (existingUser) {
            // Check if this provider account is already linked
            const existingAccount = existingUser.accounts.find(
              acc => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            );

            if (!existingAccount) {
              // Link this account to the existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
              console.log(`Linked ${account.provider} account to existing user ${existingUser.id}`);
            }
            return true;
          }
        } catch (error) {
          console.error("Error during sign-in:", error);
          return false;
        }
      }
      return true;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      console.log(`Account ${account.provider} linked to user ${user.id}`);
    },
    async signIn({ user, account, isNewUser }) {
      if (account) {
        console.log(`User ${user.email} signed in with ${account.provider}${isNewUser ? ' (new user)' : ''}`);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};