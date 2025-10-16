import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  const memberships = await prisma.orgUser.findMany({
    where: { userId: session.user.id },
    include: { org: true, roles: true }
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Role mapping</h1>
      <p className="text-muted-foreground">Determine who can create and vote on proposals.</p>
      <div className="grid gap-4">
        {memberships.map((membership) => (
          <div key={membership.id} className="rounded border bg-card p-4">
            <h2 className="text-xl font-semibold">{membership.org.name}</h2>
            <p className="text-sm text-muted-foreground">Roles: {membership.roles.map((role) => role.name).join(", ") || "None"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
