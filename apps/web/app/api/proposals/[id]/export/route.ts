import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: { votes: { include: { voter: true, option: true } } }
    });
    if (!proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const csv = [
      "proposalId,option,voter,weight,signature,signedAt",
      ...proposal.votes.map((vote) =>
        [
          proposal.id,
          vote.option?.title ?? vote.optionId,
          vote.voter.address,
          vote.weight.toString(),
          vote.signature,
          vote.signedAt.toISOString()
        ].join(",")
      )
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=proposal-${proposal.id}.csv`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to export votes" }, { status: 500 });
  }
}
