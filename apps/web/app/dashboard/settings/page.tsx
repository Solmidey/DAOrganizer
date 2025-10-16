import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  const orgs = await prisma.org.findMany({ where: { users: { some: { userId: session.user.id } } } });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Organization settings</h1>
      <p className="text-muted-foreground">
        Manage rate limits, token thresholds, and automation webhooks for your communities.
      </p>
      <div className="grid gap-4">
        {orgs.map((org) => (
          <div key={org.id} className="rounded border bg-card p-4">
            <h2 className="text-xl font-semibold">{org.name}</h2>
            <p className="text-sm text-muted-foreground">Slug: {org.slug}</p>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(org.settings, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
