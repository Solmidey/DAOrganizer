import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { VoteForm } from "@/components/vote-form";
import { TallyCard } from "@/components/tally-card";

interface Props {
  params: { id: string };
}

export default async function ProposalPage({ params }: Props) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      options: { orderBy: { index: "asc" } },
      votes: { include: { voter: true } },
      strategy: true,
      org: true
    }
  });
  if (!proposal) return notFound();

  const endsIn = formatDistanceToNow(new Date(proposal.endsAt), { addSuffix: true });
  const startsIn = formatDistanceToNow(new Date(proposal.startsAt), { addSuffix: true });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-semibold">{proposal.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{proposal.description}</p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <span className="font-medium text-foreground">Starts:</span> {new Date(proposal.startsAt).toUTCString()} ({startsIn})
            </div>
            <div>
              <span className="font-medium text-foreground">Ends:</span> {new Date(proposal.endsAt).toUTCString()} ({endsIn})
            </div>
            {proposal.quorum && (
              <div>
                <span className="font-medium text-foreground">Quorum:</span> {proposal.quorum.toString()}
              </div>
            )}
            {proposal.threshold && (
              <div>
                <span className="font-medium text-foreground">Threshold:</span> {proposal.threshold.toString()}
              </div>
            )}
          </div>
        </div>
        <VoteForm
          proposal={{
            id: proposal.id,
            endsAt: proposal.endsAt,
            options: proposal.options.map((option) => ({ id: option.id, title: option.title })),
            strategy: { type: proposal.strategy.type, config: proposal.strategy.config as Record<string, unknown> },
            snapshotBlock: proposal.snapshotBlock ? proposal.snapshotBlock.toString() : null
          }}
        />
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Options</h2>
          <ul className="mt-4 space-y-2">
            {proposal.options.map((option) => (
              <li key={option.id} className="rounded border bg-background p-3">
                <p className="font-medium">{option.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="space-y-4">
        <TallyCard
          proposal={{
            ...proposal,
            snapshotBlock: proposal.snapshotBlock,
            options: proposal.options.map((option) => ({
              ...option,
              votes: proposal.votes.filter((vote) => vote.optionId === option.id)
            }))
          }}
        />
        <div className="rounded-lg border bg-card p-4 text-sm">
          <h3 className="text-lg font-semibold">Strategy</h3>
          <p className="text-muted-foreground">{proposal.strategy.type}</p>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(proposal.strategy.config, null, 2)}
          </pre>
        </div>
      </aside>
    </div>
  );
}
