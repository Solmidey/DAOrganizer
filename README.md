# On-chain Governance Toolkit

A Vercel-ready coordination stack that connects Discord and Telegram communities to on-chain governance. It ships a Next.js 14 dashboard, webhook-powered bots, Prisma + Vercel Postgres storage, and optional OpenZeppelin Governor contracts.

## Features

- **Identity bridging:** Wallet linking flows for Discord and Telegram users, optional token/NFT gating, rate limiting, and Turnstile CAPTCHA support.
- **Proposal lifecycle:** Create proposals via dashboard or slash commands, collect EIP-712 signed ballots, and stream tallies in real time.
- **On-chain optionality:** Deploy OpenZeppelin Governor + Timelock + ERC20Votes contracts with Hardhat scripts; export addresses for the web app.
- **Audit-ready:** Public proposal pages, CSV vote exports, and on-chain transaction hooks.
- **Serverless-first:** Discord interactions and Telegram webhooks handled by Vercel Edge/serverless route handlers — no long-lived bots.

## Repository layout

```
.
├── apps/
│   └── web/              # Next.js 14 application (App Router)
├── packages/
│   ├── contracts/        # Hardhat project with OZ Governor stack
│   └── shared/           # Reusable TypeScript types + EIP-712 schemas
├── .env.example          # Environment variable template
├── pnpm-workspace.yaml   # Monorepo definition
└── vercel.json           # Vercel routing for webhooks
```

## Prerequisites

- [pnpm](https://pnpm.io/) 8+
- Node.js 18+
- A Vercel account (for deploy + Postgres)
- Discord application with slash commands enabled
- Telegram bot token (via [@BotFather](https://t.me/botfather))

## Quick start (local)

```bash
pnpm install
cp .env.example .env.local
pnpm --filter web db:push   # create schema in Postgres (adjust DATABASE_URL first)
pnpm dev
```

The dashboard is available at <http://localhost:3000>. Marketing page lives at `/`.

## Database

The project uses Prisma with Vercel Postgres (or any Postgres-compatible database). Update `DATABASE_URL` in `.env.local` and run `pnpm --filter web db:push` or `prisma migrate dev` for local migrations.

## Discord setup

1. Create a Discord application and enable the **Interactions Endpoint URL** pointing to `https://YOUR_VERCEL_DOMAIN/api/discord/interactions`.
2. Copy the **Public Key**, **Application ID**, and a bot token into your `.env.local`.
3. Register slash commands (e.g. `/link`, `/proposal`, `/vote`, `/results`) via Discord's developer portal or REST API. The bot responds with wallet-link flows, proposal creation links, and vote results.

## Telegram setup

1. Create a bot with [@BotFather](https://t.me/botfather) and grab the bot token.
2. Set a webhook that targets `https://YOUR_VERCEL_DOMAIN/api/telegram/webhook` and configure the secret header to match `TELEGRAM_WEBHOOK_SECRET`.
3. The webhook handler replies to `/link`, `/proposal`, `/vote`, and `/results` using stateless HTTPS calls.

## Wallet linking flow

1. User triggers `/link` (Discord/Telegram).
2. Bot returns a magic link to `/link?token=...`.
3. On the web, the user connects a wallet (wagmi + viem) and signs a message.
4. `/api/link` validates the Turnstile token (optional), verifies the signature, and stores the wallet ↔ social handle mapping.

## Voting flow

1. Create a proposal from Discord, Telegram, or `/dashboard/new`.
2. Users visit `/proposals/[id]`, connect a wallet, sign the EIP-712 ballot, and submit to `/api/vote`.
3. Votes are stored off-chain with replay protection. CSV exports available via `/api/proposals/[id]/export`.
4. Optional on-chain execution via the Hardhat governor deployment.

## Deploy contracts (optional)

```bash
cd packages/contracts
pnpm install
pnpm build
pnpm test
pnpm hardhat run scripts/deploy.ts --network sepolia
```

After deployment, copy the generated `apps/web/contracts/deployment.json` addresses into `.env.local` (`GOVERNOR_ADDRESS`, `GOVERNANCE_TOKEN_ADDRESS`).

## Running tests

```bash
pnpm --filter web test            # Vitest unit tests
pnpm --filter contracts test      # Hardhat test suite
```

E2E Playwright tests are scaffolded (add scenarios under `apps/web/tests`).

## Deploy to Vercel

1. Click the button below (or import manually).

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/example/onchain-governance-toolkit)

2. Provision Vercel Postgres (via the integration) and copy the connection string into `DATABASE_URL`.
3. Set secrets: `NEXTAUTH_SECRET`, `WEBHOOK_SECRET`, Discord keys, Telegram tokens, `CHAIN_ID`, `RPC_URL`, optional `TURNSTILE_*`, etc.
4. Configure **Edge Function** routing for Discord interactions and standard serverless for Telegram via the included `vercel.json`.

## Environment variables

Refer to `.env.example` for the complete list, including:

- Database: `DATABASE_URL`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Discord: `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`
- Webhooks: `WEBHOOK_SECRET`
- Blockchain: `CHAIN_ID`, `RPC_URL`, `GOVERNOR_ADDRESS`, `GOVERNANCE_TOKEN_ADDRESS`
- Client: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL`
- CAPTCHA: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## CI tips

- Run `pnpm --filter web lint` and `pnpm --filter web build` before deployment.
- Use `pnpm --filter contracts test` to ensure Solidity tests pass prior to network deployment.

## License

MIT
