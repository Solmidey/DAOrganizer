import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const proposals = await prisma.proposal.findMany({
    include: { org: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Proposals</h1>
          <p className="text-muted-foreground">Monitor live proposals and drafts across your orgs.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">New proposal</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <Link key={proposal.id} href={`/proposals/${proposal.id}`} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{proposal.title}</h2>
                <p className="text-sm text-muted-foreground">{proposal.org?.name ?? "Unassigned"}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {proposal.status} • ends {formatDistanceToNow(new Date(proposal.endsAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{proposal.description.slice(0, 180)}...</p>
          </Link>
        ))}
        {proposals.length === 0 && <div className="rounded border bg-card p-6 text-muted-foreground">No proposals yet.</div>}
      </div>
    </div>
  );
}
