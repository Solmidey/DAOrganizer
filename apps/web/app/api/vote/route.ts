import { NextResponse } from "next/server";
import { verifyTypedData, type Address } from "viem";
import { prisma } from "@/lib/prisma";
import { VOTE_TYPES, getDomain, consumeNonce } from "@/lib/eip712";
import { evaluateStrategy } from "@/lib/strategies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, optionId, signature, message, address } = body as {
      proposalId: string;
      optionId: string;
      signature: `0x${string}`;
      message: {
        proposalId: string;
        optionId: string;
        weight: string;
        nonce: string;
        snapshotBlock: string;
        deadline: string;
      };
      address: Address;
    };

    if (message.proposalId !== proposalId || message.optionId !== optionId) {
      return NextResponse.json({ error: "Payload mismatch" }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { strategy: true, org: true }
    });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (new Date(proposal.endsAt) < new Date()) {
      return NextResponse.json({ error: "Voting closed" }, { status: 403 });
    }

    if (Number(message.deadline) * 1000 < Date.now()) {
      return NextResponse.json({ error: "Ballot expired" }, { status: 400 });
    }

    if (new Date(proposal.startsAt) > new Date()) {
      return NextResponse.json({ error: "Voting not started" }, { status: 403 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { address: address.toLowerCase() } });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not linked" }, { status: 401 });
    }

    try {
      await consumeNonce(wallet.id, message.nonce);
    } catch (err) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 400 });
    }

    const chainId = Number(process.env.CHAIN_ID ?? 84532);
    const verifyingContractEnv = process.env.GOVERNOR_ADDRESS;
    const verifyingContract = verifyingContractEnv && verifyingContractEnv.startsWith("0x") ? (verifyingContractEnv as `0x${string}`) : undefined;
    const domain = getDomain(chainId, verifyingContract);
    const valid = await verifyTypedData({
      address,
      domain,
      types: VOTE_TYPES,
      primaryType: "Vote",
      message,
      signature
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const weight = await evaluateStrategy({
      type: proposal.strategy.type as any,
      config: proposal.strategy.config as Record<string, unknown>,
      voterAddress: address
    });

    if (weight <= 0) {
      return NextResponse.json({ error: "Not eligible" }, { status: 403 });
    }

    const weightValue = weight.toString();

    const vote = await prisma.vote.upsert({
      where: { proposalId_walletId: { proposalId, walletId: wallet.id } },
      update: {
        optionId,
        weight: weightValue,
        signature,
        strategyData: proposal.strategy.config
      },
      create: {
        proposalId,
        optionId,
        walletId: wallet.id,
        weight: weightValue,
        signature,
        strategyData: proposal.strategy.config
      }
    });

    return NextResponse.json({ vote });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to process vote" }, { status: 500 });
  }
}
