# AGENTS.md

## Project

Echo Markets is a paper-trading platform for market psychology experiments. Throw fake money at real-feeling markets. Live tickers, order matching, portfolio tracking — no real risk, all the signal.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Prisma (PostgreSQL)
- Redis
- Jest (testing)

## Key Architecture

```
app/          React pages and routes
components/   UI components
contexts/     React contexts
hooks/        Custom hooks
lib/          Shared utilities
prisma/       Schema and migrations
scripts/      Market engine scripts (ticker, matcher, narrator, bell)
tests/        Unit and integration tests
```

## Important Scripts

- `npm run dev:ticker` — start market ticker
- `npm run engine:orders` — order matching engine
- `npm run db:generate` — generate Prisma client

These are separate processes from the Next.js dev server.

## Design Direction

Trading terminal aesthetic — dense information, clean typography, green/red indicators. Not a gamified "investing app." Think Bloomberg terminal crossed with a play-money sandbox.

No charts unless they serve the experiment. No SaaS dashboard patterns.

## Current Status

Beta. Market behavior is simulated — not real data, not real money. Package metadata still uses an older placeholder name.

## What Not To Build Yet

- Real market data feeds
- Multi-user lobbies
- Historical replay mode
- Strategy backtesting

Focus on the single-user paper-trading loop.

## Development

```bash
npm install
npm run db:generate
npm run dev
```

## Definition of Done

- App runs with `npm run dev`
- Ticker process runs alongside
- Order matching works end-to-end
- Portfolio tracks P&L correctly
- Tests pass with `npm run test`
