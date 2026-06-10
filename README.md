# Echo Markets

**Paper-trading platform for market psychology experiments.**

![Showcase](showcase/echo-markets.gif)

Echo Markets is a Next.js playground where you can throw fake money at real-feeling markets. Live tickers, order matching, portfolio tracking — no real risk, all the signal.

## Features

- **Live ticker** — simulated market data with configurable volatility
- **Order matching** — fill simulation with narration and delay models
- **Portfolio tracking** — P&L, exposure, position history per session
- **Market narrator** — color commentary on price action and fills
- **Closing bell** — session-end recap with performance summary
- **Prisma-backed state** — PostgreSQL via Prisma for persistent sessions

## Stack

Next.js 15 · React 19 · TypeScript · Prisma · Redis · Jest

## Quick start

```bash
npm install
npm run db:generate
npm run dev
```

```bash
npm run test          # unit + integration
npm run build         # production build check
npm run dev:ticker    # start market ticker
npm run engine:orders # order matching engine
```

## Project layout

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

## Status

Beta. Market behavior is simulated — not real data, not real money. Package metadata still uses an older placeholder name.

## Next

- Real market data feeds
- Multi-user lobbies
- Historical replay mode
- Strategy backtesting
