import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVoteNonce } from "@/lib/eip712";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const proposal = await prisma.proposal.findUnique({ where: { id: params.id } });
    if (!proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const wallet = await prisma.wallet.findFirst({ where: { userId: session.user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "No linked wallet" }, { status: 400 });
    }
    const nonce = await getVoteNonce(wallet.id);
    return NextResponse.json({ nonce });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to issue nonce" }, { status: 500 });
  }
}
