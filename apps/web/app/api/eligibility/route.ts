import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateStrategy } from "@/lib/strategies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, address } = body as { proposalId: string; address: `0x${string}` };
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, include: { strategy: true } });
    if (!proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const weight = await evaluateStrategy({
      type: proposal.strategy.type as any,
      config: proposal.strategy.config as Record<string, unknown>,
      voterAddress: address
    });
    return NextResponse.json({ eligible: weight > 0, weight });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Eligibility check failed" }, { status: 500 });
  }
}
