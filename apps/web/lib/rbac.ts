import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "MODERATOR" | "MEMBER";

export async function assertOrgRole(orgId: string, userId: string, allowed: Role[]) {
  const membership = await prisma.orgUser.findFirst({
    where: { orgId, userId },
    include: { roles: true }
  });
  if (!membership) {
    throw new Error("User not in org");
  }
  const roleNames = membership.roles.map((role) => role.name as Role);
  const hasRole = allowed.some((role) => roleNames.includes(role));
  if (!hasRole) {
    throw new Error("Insufficient permissions");
  }
}

export const RBAC = {
  adminOnly: (orgId: string, userId: string) => assertOrgRole(orgId, userId, ["ADMIN"]),
  moderators: (orgId: string, userId: string) => assertOrgRole(orgId, userId, ["ADMIN", "MODERATOR"])
};
