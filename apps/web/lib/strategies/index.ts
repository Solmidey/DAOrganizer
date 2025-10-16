import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { prisma } from "@/lib/prisma";
import type { StrategyType } from "@/shared/types";

const RPC_URL = process.env.RPC_URL ?? baseSepolia.rpcUrls.default.http[0];

const client = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });

export async function evaluateStrategy(params: {
  type: StrategyType;
  config: Record<string, unknown>;
  voterAddress: `0x${string}`;
}) {
  switch (params.type) {
    case "ERC20_BALANCE":
      return evaluateErc20Balance(params);
    case "ERC721_OWNERSHIP":
      return evaluateNftOwnership(params);
    case "ONE_PERSON_ONE_VOTE":
      return 1;
    case "ROLE_GATED":
      return evaluateRoleGate(params);
    default:
      return 0;
  }
}

async function evaluateErc20Balance({ config, voterAddress }: { config: Record<string, unknown>; voterAddress: `0x${string}` }) {
  const tokenAddress = config.tokenAddress as `0x${string}`;
  const decimals = Number(config.decimals ?? 18);
  const minBalance = config.minBalance ? BigInt(config.minBalance as string) : 0n;
  const snapshotBlock = config.snapshotBlock ? BigInt(config.snapshotBlock as string) : undefined;

  const balance = await client.readContract({
    abi: [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] }],
    address: tokenAddress,
    functionName: "balanceOf",
    args: [voterAddress],
    blockNumber: snapshotBlock
  }).catch(() => 0n);
  if (balance < minBalance) return 0;
  return Number(formatUnits(balance, decimals));
}

async function evaluateNftOwnership({ config, voterAddress }: { config: Record<string, unknown>; voterAddress: `0x${string}` }) {
  const collectionAddress = config.collectionAddress as `0x${string}`;
  const minCount = Number(config.minCount ?? 1);
  const snapshotBlock = config.snapshotBlock ? BigInt(config.snapshotBlock as string) : undefined;
  const balance = await client.readContract({
    abi: [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] }],
    address: collectionAddress,
    functionName: "balanceOf",
    args: [voterAddress],
    blockNumber: snapshotBlock
  }).catch(() => 0n);
  return balance >= BigInt(minCount) ? Number(balance) : 0;
}

async function evaluateRoleGate({ config, voterAddress }: { config: Record<string, unknown>; voterAddress: `0x${string}` }) {
  const wallet = await prisma.wallet.findUnique({ where: { address: voterAddress.toLowerCase() } });
  if (!wallet?.userId) return 0;
  const allowedRoles = new Set((config.allowedRoles as string[]) ?? []);
  const orgId = typeof config.orgId === "string" ? config.orgId : undefined;
  const membership = await prisma.orgUser.findMany({
    where: {
      userId: wallet.userId,
      ...(orgId ? { orgId } : {})
    },
    include: { roles: true }
  });
  return membership.some((m) => m.roles.some((role) => allowedRoles.has(role.name))) ? 1 : 0;
}
