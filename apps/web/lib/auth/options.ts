import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/security";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const payload = await verifyWebhookSignature(credentials.token);
        if (!payload) return null;

        const user = await prisma.user.upsert({
          where: { id: payload.userId },
          update: {},
          create: {
            id: payload.userId,
            [payload.platform === "discord" ? "discordId" : "telegramId"]: payload.platformId
          }
        });
        return { id: user.id, name: payload.displayName ?? "User" };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user = session.user ?? {};
        session.user.id = token.sub;
      }
      return session;
    }
  }
};
