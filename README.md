# Echo Markets

Paper-trading interface for market psychology and portfolio rehearsal.

Live demo: https://lattice-trading.vercel.app

![Echo Markets demo](showcase/echo-markets.gif)

Echo Markets turns simulated markets into a playable culture-trading loop. Players react to rumor beats, vote on narrative direction, place paper trades, and watch influence, portfolio value, and market sentiment move together. No real money is involved.

## What Is Showable

- Browser game UI with market pulse, narrative votes, quick trade console, portfolio state, and culture/faction panels
- Demo-mode API fallbacks for public deployments when database services are not configured
- Simulated market engine, order execution route, leaderboard route, and guest-session route
- Prisma-backed path for persistent sessions when a real database is connected

## Public Demo Notes

The hosted demo is intentionally a paper-trading prototype. It uses simulated prices and demo users. If the database is unavailable, public routes fall back to deterministic demo responses instead of throwing noisy 500s into the browser console.

## Proof

- Existing animated showcase: [showcase/echo-markets.gif](showcase/echo-markets.gif)
- Desktop proof: [showcase/echo-markets-desktop.png](showcase/echo-markets-desktop.png)
- Mobile proof: [showcase/echo-markets-mobile.png](showcase/echo-markets-mobile.png)

## Stack

Next.js 15, React 19, TypeScript, Prisma, Redis, Jest, Tailwind.

## Run Locally

```bash
corepack pnpm install
corepack pnpm exec prisma generate
corepack pnpm dev
```

Useful checks:

```bash
corepack pnpm test
corepack pnpm build
corepack pnpm dev:ticker
corepack pnpm engine:orders
```

## Project Layout

```text
app/          Next.js app routes and screens
components/   UI components
contexts/     React state providers
hooks/        Custom hooks
lib/          Market engine, auth helpers, DB helpers
prisma/       Schema and migrations
scripts/      Ticker, matcher, narrator, and setup scripts
showcase/     Public proof media
tests/        Unit and integration tests
```

## Status

Beta. Market behavior is simulated, API fallbacks are demo-mode by design, and the project should not be described as real trading infrastructure.
