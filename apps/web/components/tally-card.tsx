import type { Proposal, Option, Vote } from "@prisma/client";

interface ProposalWithRelations extends Proposal {
  options: (Option & { votes: Vote[] })[];
}

export function TallyCard({ proposal }: { proposal: ProposalWithRelations }) {
  const totals = proposal.options.map((option) => ({
    option,
    sum: option.votes.reduce((sum, vote) => sum + Number(vote.weight), 0)
  }));

  const totalVotes = totals.reduce((sum, option) => sum + option.sum, 0);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">Live tally</h2>
      <p className="text-sm text-muted-foreground">Totals update as signed ballots arrive.</p>
      <div className="mt-4 space-y-3">
        {totals.map(({ option, sum }) => {
          const percentage = totalVotes > 0 ? Math.round((sum / totalVotes) * 100) : 0;
          return (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{option.title}</span>
                <span>
                  {sum.toFixed(2)} ({percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div className="h-2 rounded bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Quorum: {proposal.quorum ? proposal.quorum.toString() : "n/a"} • Snapshot block: {proposal.snapshotBlock ?? "latest"}
      </p>
    </div>
  );
}
