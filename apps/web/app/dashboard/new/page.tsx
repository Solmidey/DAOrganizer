import { prisma } from "@/lib/prisma";
import { ProposalForm } from "@/components/proposal-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function NewProposalPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const strategies = await prisma.strategy.findMany({
    where: { org: { users: { some: { userId: session!.user!.id } } } }
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Create proposal</h1>
      <p className="text-muted-foreground">Configure voting window, quorum, and strategy in one place.</p>
      <div className="mt-6">
        <ProposalForm strategies={strategies} />
      </div>
    </div>
  );
}
