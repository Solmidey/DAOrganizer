import type { Address } from "viem";

export const EIP712_DOMAIN_NAME = "OnchainGovernanceToolkit";
export const EIP712_DOMAIN_VERSION = "1";

export interface VoteMessage {
  proposalId: string;
  optionId: string;
  weight: string;
  nonce: string;
  snapshotBlock: string;
  deadline: string;
}

export const VOTE_TYPES = {
  Vote: [
    { name: "proposalId", type: "string" },
    { name: "optionId", type: "string" },
    { name: "weight", type: "string" },
    { name: "nonce", type: "string" },
    { name: "snapshotBlock", type: "string" },
    { name: "deadline", type: "string" }
  ]
} as const;

export const LINK_MESSAGE = {
  types: {
    Link: [
      { name: "userId", type: "string" },
      { name: "platform", type: "string" },
      { name: "nonce", type: "string" },
      { name: "issuedAt", type: "string" }
    ]
  },
  primaryType: "Link"
} as const;

export interface LinkMessage {
  userId: string;
  platform: "discord" | "telegram";
  nonce: string;
  issuedAt: string;
}

export const domain = (chainId: number, verifyingContract?: Address) => ({
  name: EIP712_DOMAIN_NAME,
  version: EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract: verifyingContract ?? "0x0000000000000000000000000000000000000000"
});
