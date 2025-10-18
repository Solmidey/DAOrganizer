export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramSecret } from "@/lib/telegram";
import { signWebhookPayload } from "@/lib/security";

const TELEGRAM_API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = TELEGRAM_API_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_API_TOKEN}` : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_API_BASE) return;
  await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-telegram-bot-api-secret-token") ?? undefined;
    verifyTelegramSecret(secret);
    const body = await request.json();

    const message = body.message ?? body.edited_message;
    const chatId = message?.chat?.id;
    const text: string = message?.text ?? "";

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const [command, ...args] = text.split(" ");

    switch (command) {
      case "/start":
      case "/link": {
        const payload = await signWebhookPayload({
          userId: String(message.from.id),
          platform: "telegram",
          platformId: String(message.from.id),
          displayName: message.from.username,
          iat: Date.now()
        });
        await sendMessage(chatId, `Tap to link your wallet: ${appUrl}/link?token=${payload}`);
        return NextResponse.json({ ok: true });
      }
      case "/proposal": {
        await sendMessage(chatId, `Create proposals here: ${appUrl}/dashboard/new`);
        return NextResponse.json({ ok: true });
      }
      case "/vote": {
        const proposalId = args[0];
        if (!proposalId) {
          await sendMessage(chatId, "Usage: /vote <proposalId>");
          return NextResponse.json({ ok: true });
        }
        await sendMessage(chatId, `Vote now: ${appUrl}/proposals/${proposalId}`);
        return NextResponse.json({ ok: true });
      }
      case "/results": {
        const proposalId = args[0];
        if (!proposalId) {
          await sendMessage(chatId, "Usage: /results <proposalId>");
          return NextResponse.json({ ok: true });
        }
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: { options: { include: { votes: true } } }
        });
        if (!proposal) {
          await sendMessage(chatId, "Proposal not found");
          return NextResponse.json({ ok: true });
        }
        const tally = proposal.options
          .map((option) => `${option.title}: ${option.votes.reduce((sum, vote) => sum + Number(vote.weight), 0)}`)
          .join("\n");
        await sendMessage(chatId, `Results for ${proposal.title}:\n${tally}`);
        return NextResponse.json({ ok: true });
      }
      default:
        await sendMessage(chatId, "Unknown command");
        return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
