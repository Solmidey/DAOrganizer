"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatISO } from "date-fns";
import type { Strategy } from "@prisma/client";
import { TurnstileWidget } from "@/components/turnstile-widget";

interface ProposalFormProps {
  strategies: Strategy[];
}

export function ProposalForm({ strategies }: ProposalFormProps) {
  const router = useRouter();
  if (strategies.length === 0) {
    return <p className="rounded border bg-card p-4 text-sm text-muted-foreground">No strategies configured. Add one in settings.</p>;
  }
  const [form, setForm] = useState({
    orgId: strategies[0]?.orgId ?? "",
    title: "",
    description: "",
    quorum: "",
    threshold: "",
    strategyId: strategies[0]?.id ?? "",
    options: ["For", "Against"],
    startsAt: formatISO(new Date(), { representation: "complete" }),
    endsAt: formatISO(new Date(Date.now() + 3 * 24 * 3600 * 1000), { representation: "complete" })
  });
  const [isSubmitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const updateOption = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option))
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, "New option"]
    }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        options: form.options.map((title) => ({ title })),
        turnstileToken
      })
    });
    setSubmitting(false);
    if (!res.ok) {
      const error = await res.json();
      window.alert(error.error ?? "Failed to create proposal");
      return;
    }
    const { proposal } = await res.json();
    router.push(`/proposals/${proposal.id}`);
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          className="mt-1 w-full rounded border bg-background p-2"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="mt-1 w-full rounded border bg-background p-2"
          rows={5}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Starts at</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border bg-background p-2"
            value={form.startsAt.slice(0, 16)}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ends at</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border bg-background p-2"
            value={form.endsAt.slice(0, 16)}
            onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Quorum (optional)</label>
          <input
            className="mt-1 w-full rounded border bg-background p-2"
            value={form.quorum}
            onChange={(event) => setForm((prev) => ({ ...prev, quorum: event.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Threshold (optional)</label>
          <input
            className="mt-1 w-full rounded border bg-background p-2"
            value={form.threshold}
            onChange={(event) => setForm((prev) => ({ ...prev, threshold: event.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Strategy</label>
        <select
          className="mt-1 w-full rounded border bg-background p-2"
          value={form.strategyId}
          onChange={(event) => setForm((prev) => ({ ...prev, strategyId: event.target.value }))}
        >
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.type}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Options</label>
          <Button type="button" variant="outline" onClick={addOption}>
            Add option
          </Button>
        </div>
        {form.options.map((option, index) => (
          <input
            key={index}
            className="w-full rounded border bg-background p-2"
            value={option}
            onChange={(event) => updateOption(index, event.target.value)}
          />
        ))}
      </div>
      <TurnstileWidget siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create proposal"}
      </Button>
    </form>
  );
}
