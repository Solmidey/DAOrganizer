"use client";

import { useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAccount, useSignTypedData, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { useRouter } from "next/navigation";
import { VOTE_TYPES } from "@/lib/eip712";

interface VoteFormProps {
  proposal: {
    id: string;
    endsAt: Date;
    options: { id: string; title: string }[];
    strategy: { type: string; config: Record<string, unknown> };
    snapshotBlock: string | null;
  };
}

export function VoteForm({ proposal }: VoteFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const connector = useMemo(() => new InjectedConnector(), []);
  const { connect } = useConnect({ connector });
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();
  const [optionId, setOption] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleVote = async () => {
    if (!optionId) return;
    if (!isConnected) {
      connect();
      return;
    }
    if (!address) return;
    const deadline = Math.floor(new Date(proposal.endsAt).getTime() / 1000).toString();
    const nonceResponse = await fetch(`/api/eligibility`, {
      method: "POST",
      body: JSON.stringify({ proposalId: proposal.id, address }),
      headers: { "Content-Type": "application/json" }
    });
    if (!nonceResponse.ok) {
      window.alert("Eligibility check failed");
      return;
    }
    const eligibility = await nonceResponse.json();
    if (!eligibility.eligible) {
      window.alert("You are not eligible to vote");
      return;
    }

    const noncePayload = await fetch(`/api/proposals/${proposal.id}/nonce`, { method: "POST" });
    if (!noncePayload.ok) {
      const error = await noncePayload.json();
      window.alert(error.error ?? "Unable to fetch nonce");
      return;
    }
    const nonceData = await noncePayload.json();

    const message = {
      proposalId: proposal.id,
      optionId,
      weight: String(eligibility.weight ?? "0"),
      nonce: nonceData.nonce,
      snapshotBlock: proposal.snapshotBlock ?? "0",
      deadline
    } as const;

    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);

    const signature = await signTypedDataAsync({
      primaryType: "Vote",
      domain: {
        name: "OnchainGovernanceToolkit",
        version: "1",
        chainId
      },
      types: VOTE_TYPES,
      message
    });

    startTransition(async () => {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id, optionId, signature, message, address })
      });
      if (!res.ok) {
        const error = await res.json();
        window.alert(error.error ?? "Failed to vote");
        return;
      }
      window.alert("Vote recorded");
      router.refresh();
    });
  };

  if (!session) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Connect via Discord or Telegram to vote.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">Cast your vote</h2>
      <div className="space-y-2">
        {proposal.options.map((option) => (
          <label key={option.id} className="flex items-center gap-3 rounded border p-3">
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={optionId === option.id}
              onChange={() => setOption(option.id)}
            />
            <span>{option.title}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button onClick={() => connect()} disabled={isPending}>
            Connect wallet
          </Button>
        ) : (
          <Button variant="outline" onClick={() => disconnect()}>
            Disconnect {address?.slice(0, 6)}
          </Button>
        )}
        <Button onClick={handleVote} disabled={!optionId || isPending}>
          {isPending ? "Submitting..." : "Submit vote"}
        </Button>
      </div>
    </div>
  );
}
