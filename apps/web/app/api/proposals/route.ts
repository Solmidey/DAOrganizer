import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RBAC } from "@/lib/rbac";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { z } from "zod";
import { consume } from "@/lib/rateLimit";

const proposalSchema = z.object({
  orgId: z.string(),
  title: z.string().min(3),
  description: z.string().min(10),
  startsAt: z.string(),
  endsAt: z.string(),
  quorum: z.string().optional(),
  threshold: z.string().optional(),
  strategyId: z.string(),
  options: z.array(z.object({ title: z.string().min(1) })).min(2).max(10),
  execution: z.any().optional(),
  turnstileToken: z.string().optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }
  const proposals = await prisma.proposal.findMany({
    where: { orgId },
    include: { options: true, strategy: true },
    orderBy: { startsAt: "desc" }
  });
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = proposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    if (process.env.TURNSTILE_SECRET) {
      if (!body.turnstileToken) {
        return NextResponse.json({ error: "CAPTCHA required" }, { status: 400 });
      }
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET, response: body.turnstileToken })
      });
      const verification = await verify.json();
      if (!verification.success) {
        return NextResponse.json({ error: "CAPTCHA failed" }, { status: 400 });
      }
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await RBAC.moderators(parsed.data.orgId, session.user.id);
    try {
      await consume(`proposal-${session.user.id}`, 3, 60);
    } catch (error) {
      return NextResponse.json({ error: "Slow down" }, { status: 429 });
    }

    const strategy = await prisma.strategy.findUnique({ where: { id: parsed.data.strategyId } });
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }
    if (strategy.orgId !== parsed.data.orgId) {
      return NextResponse.json({ error: "Strategy not available for this org" }, { status: 400 });
    }

    const proposal = await prisma.proposal.create({
      data: {
        orgId: parsed.data.orgId,
        title: parsed.data.title,
        description: parsed.data.description,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        quorum: parsed.data.quorum ? parsed.data.quorum : undefined,
        threshold: parsed.data.threshold ? parsed.data.threshold : undefined,
        strategyId: parsed.data.strategyId,
        createdById: session.user.id,
        status: "ACTIVE",
        execution: parsed.data.execution,
        options: { createMany: { data: parsed.data.options.map((option, index) => ({ title: option.title, index })) } }
      },
      include: { options: true }
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
