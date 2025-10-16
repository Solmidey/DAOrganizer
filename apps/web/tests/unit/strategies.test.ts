import { describe, it, expect, vi } from "vitest";
import { evaluateStrategy } from "@/lib/strategies";

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      wallet: {
        findUnique: vi.fn(async () => ({ id: "wallet", userId: "user" }))
      },
      orgUser: {
        findMany: vi.fn(async () => [
          { id: "membership", roles: [{ name: "ADMIN" }] }
        ])
      }
    }
  };
});

describe("evaluateStrategy", () => {
  it("returns 1 for role gated when role matches", async () => {
    const weight = await evaluateStrategy({
      type: "ROLE_GATED",
      config: { allowedRoles: ["ADMIN"] },
      voterAddress: "0xabc" as `0x${string}`
    });
    expect(weight).toBe(1);
  });
});
