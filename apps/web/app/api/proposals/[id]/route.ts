import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { RBAC } from "@/lib/rbac";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { options: true, votes: { include: { voter: true } }, strategy: true }
  });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ proposal });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const proposal = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await RBAC.adminOnly(proposal.orgId, session.user.id);
  const body = await request.json();
  const updated = await prisma.proposal.update({
    where: { id: params.id },
    data: body
  });
  return NextResponse.json({ proposal: updated });
}
