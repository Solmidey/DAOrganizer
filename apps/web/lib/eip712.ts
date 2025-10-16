import crypto from "crypto";
import { type VoteMessage, VOTE_TYPES, domain, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from "@/shared/eip712";
import { type Hex, keccak256, encodePacked } from "viem";
import { prisma } from "@/lib/prisma";

export async function getVoteNonce(walletId: string) {
  const nonce = await prisma.nonce.create({
    data: {
      walletId,
      value: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });
  return nonce.value;
}

export async function consumeNonce(walletId: string, value: string) {
  const nonce = await prisma.nonce.findFirst({ where: { walletId, value, consumed: false } });
  if (!nonce) throw new Error("Invalid nonce");
  if (nonce.expiresAt < new Date()) throw new Error("Nonce expired");
  await prisma.nonce.update({ where: { id: nonce.id }, data: { consumed: true } });
}

export function hashVote(chainId: number, verifyingContract: `0x${string}`, message: VoteMessage): Hex {
  const encoded = encodePacked(
    ["string", "string", "string", "string", "string", "string"],
    [message.proposalId, message.optionId, message.weight, message.nonce, message.snapshotBlock, message.deadline]
  );
  return keccak256(encoded);
}

export const getDomain = (chainId: number, verifyingContract?: `0x${string}`) => domain(chainId, verifyingContract);

export { VOTE_TYPES, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION };
