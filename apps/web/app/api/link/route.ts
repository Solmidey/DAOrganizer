import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, address, signature } = body as { token: string; address: `0x${string}`; signature: `0x${string}` };
    if (!token || !address || !signature) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    const payload = await verifyWebhookSignature(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (Date.now() - payload.iat > 10 * 60 * 1000) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }
    const message = `Link wallet to governance toolkit\nToken: ${token}\nAddress: ${address}`;
    const validSignature = await verifyMessage({ address, message, signature });
    if (!validSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const wallet = await prisma.wallet.upsert({
      where: { address: address.toLowerCase() },
      update: { userId: payload.userId },
      create: {
        address: address.toLowerCase(),
        chainId: Number(process.env.CHAIN_ID ?? 84532),
        user: {
          connectOrCreate: {
            where: { id: payload.userId },
            create: {
              id: payload.userId,
              ...(payload.platform === "discord"
                ? { discordId: payload.platformId }
                : { telegramId: payload.platformId })
            }
          }
        }
      }
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 });
  }
}
