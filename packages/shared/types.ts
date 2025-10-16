import { Address } from "viem";

export type StrategyType =
  | "ERC20_BALANCE"
  | "ERC721_OWNERSHIP"
  | "ONE_PERSON_ONE_VOTE"
  | "ROLE_GATED";

export type ProposalStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUCCEEDED"
  | "DEFEATED"
  | "QUEUED"
  | "EXECUTED"
  | "CANCELED";

export interface StrategyConfigBase {
  snapshotBlock: bigint;
}

export interface TokenWeightedConfig extends StrategyConfigBase {
  tokenAddress: Address;
  decimals: number;
  minBalance?: string;
}

export interface NftOwnershipConfig extends StrategyConfigBase {
  collectionAddress: Address;
  minCount?: number;
}

export interface RoleGatedConfig extends StrategyConfigBase {
  allowedRoles: string[];
}

export interface ProposalOption {
  id: string;
  title: string;
  index: number;
}

export interface ProposalSummary {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  quorum?: string;
  threshold?: string;
  status: ProposalStatus;
  strategyType: StrategyType;
  options: ProposalOption[];
}

export interface VoteReceipt {
  id: string;
  proposalId: string;
  optionId: string;
  voter: Address;
  weight: string;
  signature: string;
  signedAt: string;
  proofUri?: string;
}

export interface DiscordCommandOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
}

export interface DiscordCommand {
  name: string;
  description: string;
  options?: DiscordCommandOption[];
}
