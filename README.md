# Echo Markets

Paper-trading market prototype with live-ticker scripts, order-matching/narration experiments, Prisma data workflows, and beta/deployment notes.

## What is here

- `app/`, `components/`, `contexts/`, `hooks/`, and `lib/` - Next.js application code.
- `prisma/` - database schema and migration workflow.
- `scripts/dev-ticker.mjs`, `enhanced-market-ticker.mjs`, `order-matcher.mjs`, `narrator.mjs`, and `closing-bell.mjs` - market simulation and engine scripts.
- `tests/unit` and `tests/integration` - Jest test coverage.
- `BETA-CHECKLIST.md`, `COMMAND_SYSTEM.md`, `DEPLOYMENT.md`, and `MIGRATION-NEXT-STEPS.md` - project notes.

## Stack

- Next.js 15
- React 19
- TypeScript
- Prisma
- Redis
- Jest

## Run locally

```bash
npm install
npm run db:generate
npm run dev
```

Useful checks:

```bash
npm run test
npm run build
npm run deploy:prepare
```

Engine scripts:

```bash
npm run dev:ticker
npm run engine:orders
npm run engine:narrator
npm run engine:close
```

## Status

Prototype/beta workspace. The package metadata still uses an older placeholder name, and market behavior should be treated as simulation until data sources, matching rules, and deployment configuration are verified.
