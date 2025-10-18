export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import { verifyDiscordSignature } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { signWebhookPayload } from "@/lib/security";
import type { Prisma } from "@prisma/client";

type ProposalWithVotes = Prisma.ProposalGetPayload<{
  include: { options: { include: { votes: true } } };
}>;

type ProposalOptionWithVotes = ProposalWithVotes["options"][number];
type ProposalVote = ProposalOptionWithVotes["votes"][number];

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const rawBody = await request.text();
  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing headers" }, { status: 401 });
  }
  const valid = verifyDiscordSignature({ body: rawBody, signature, timestamp });
  if (!valid) {
    return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
  }
  try {
    const body = JSON.parse(rawBody);

    if (body.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    const guildId = body.guild_id as string | undefined;
    const user = body.member?.user ?? body.user;

    switch (body.data?.name) {
      case "link": {
        const payload = await signWebhookPayload({
          userId: user.id,
          platformId: user.id,
          platform: "discord",
          displayName: user.global_name ?? user.username,
          iat: Date.now()
        });
        const url = `${appUrl}/link?token=${payload}`;
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 1 << 6,
            content: `Tap to link your wallet: ${url}`
          }
        });
      }
      case "proposal": {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `${user.username} start proposals at ${appUrl}/dashboard/new?guild=${guildId}`
          }
        });
      }
      case "vote": {
        const proposalId = body.data?.options?.[0]?.value as string | undefined;
        if (!proposalId) {
          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Provide a proposal id" }
          });
        }
        const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
        if (!proposal) {
          return NextResponse.json({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "Proposal not found" } });
        }
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Vote now: ${appUrl}/proposals/${proposalId}`
          }
        });
      }
      case "results": {
        const proposalId = body.data?.options?.[0]?.value as string | undefined;
        if (!proposalId) {
          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Provide a proposal id" }
          });
        }
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: { options: { include: { votes: true } } }
        });
        if (!proposal) {
          return NextResponse.json({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "Proposal not found" } });
        }
        const options: ProposalOptionWithVotes[] = proposal.options;
        const tally = options
          .map((option) => {
            const totalVotes = option.votes.reduce<number>((sum, vote: ProposalVote) => sum + Number(vote.weight), 0);
            return `${option.title}: ${totalVotes}`;
          })
          .join("\n");
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Results for ${proposal.title}:\n${tally}` }
        });
      }
      default:
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "Command not implemented" }
        });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
