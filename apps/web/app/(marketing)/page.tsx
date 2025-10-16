import Link from "next/link";
import { ArrowRight, Blocks, Bot, Coins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Sybil resistant identity",
    description: "Link wallets with Discord & Telegram roles, enforce token/NFT gating, and capture signed proofs.",
    icon: ShieldCheck
  },
  {
    title: "Snapshot-style proposals",
    description: "Spin up weighted votes, one-person ballots, or on-chain governance in minutes.",
    icon: Blocks
  },
  {
    title: "Bots without servers",
    description: "Serverless slash commands and webhooks keep Discord & Telegram in sync.",
    icon: Bot
  },
  {
    title: "Treasury safe",
    description: "Signed off-chain votes by default, optional Governor execution on Base Sepolia.",
    icon: Coins
  }
];

export default function MarketingPage() {
  return (
    <main className="flex flex-col gap-16 py-16">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-muted px-4 py-1 text-sm text-muted-foreground">Vercel Edge native</span>
        <h1 className="text-4xl font-bold sm:text-5xl">On-chain Governance Toolkit</h1>
        <p className="text-lg text-muted-foreground">
          A drop-in governance control room that coordinates proposals, votes, and execution across Discord, Telegram,
          and public blockchains. Deployable in minutes with zero infra cost.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=applications.commands" target="_blank">
              Add to Discord
            </Link>
          </Button>
          <Button variant="ghost" asChild size="lg">
            <Link href="https://t.me/YOUR_BOT" target="_blank">
              Add to Telegram
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border bg-card p-6 shadow-sm">
            <feature.icon className="mb-4 h-10 w-10 text-primary" />
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-6 text-muted-foreground">
        <h2 className="text-2xl font-semibold text-foreground">Why it works</h2>
        <ul className="grid gap-4 text-left sm:grid-cols-2">
          <li className="rounded-lg border bg-background p-4">
            <p className="font-medium text-foreground">Webhooks only</p>
            <p className="text-sm">Discord interactions & Telegram webhooks keep everything stateless and Vercel-native.</p>
          </li>
          <li className="rounded-lg border bg-background p-4">
            <p className="font-medium text-foreground">Weighted strategies</p>
            <p className="text-sm">ERC20Votes, NFT counts, and role mapping strategies ship out of the box.</p>
          </li>
          <li className="rounded-lg border bg-background p-4">
            <p className="font-medium text-foreground">Open infra</p>
            <p className="text-sm">Viem + wagmi for chains, Prisma + Vercel Postgres for data, no paid servers needed.</p>
          </li>
          <li className="rounded-lg border bg-background p-4">
            <p className="font-medium text-foreground">Auditable by design</p>
            <p className="text-sm">Signed ballots, CSV exports, and optional on-chain execution with OZ Governor.</p>
          </li>
        </ul>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Ready to deploy?</h2>
        <p className="text-muted-foreground">
          Follow the README to provision Vercel Postgres, register Discord and Telegram bots, and push live in under
          ten minutes.
        </p>
        <Button asChild size="lg">
          <Link href="https://vercel.com/new/clone?repository-url=https://github.com/example/onchain-governance-toolkit" target="_blank">
            Deploy to Vercel <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}
