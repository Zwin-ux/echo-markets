# Echo Markets — System Architecture Overview

This document describes the end-to-end architecture for the MMO market game. It focuses on modularity, real-time multiplayer, and an incremental path from the current single-user simulation to a server-authoritative economy.

## Goals
- Multiplayer-first design with server authority over cash/positions/orders
- Modular front-end UI with pluggable modules (terminal, trading, portfolio, charts, news, narrator, leaderboard, simulation)
- Real-time updates (ticks, orders, trades, leaderboards) with low coupling
- Easy local development and simple, scalable deployment

## High-Level Architecture
- Client (Next.js, React, TypeScript)
  - UI Modules live under `components/`
  - State contexts under `contexts/`
  - Client libraries under `lib/` (api, supabase client, db helpers, types)
  - Session bootstrap on load (`components/session-bootstrap.tsx`)
- Backend (Supabase: Postgres + Auth + Realtime + RPC)
  - Database schema for profiles, portfolios, holdings, orders, trades, ticks, leaderboards
  - RLS policies to protect per-user data; public read for read-only feeds (ticks/trades/leaderboard)
  - RPC functions for order placement/cancellation; later: matching engine hooks
  - Realtime publications for `ticks`, `orders`, `trades`, and `leaderboards`
- Matching Engine (Phase 1 → 2)
  - Phase 1: Simplified matching via RPC/jobs over a central order book per symbol (single-node correctness)
  - Phase 2: Dedicated service (serverless function or worker) to maintain books, perform FIFO matching, partial fills, and publish results

## Data Flow (Happy Path)
1) User loads app → session bootstrap signs in (anonymous or magic link) and calls `init_user` RPC
2) User places an order from `trading-module.tsx` → client calls `place_order` RPC → order written to DB (status = open)
3) Matching process fills order based on current book/tick → `orders` updated (filled/cancelled), `trades` inserted, `holdings`/`portfolios` updated
4) Realtime events broadcast to clients subscribed to `orders`, `trades`, `ticks` → UI updates instantly

## Module Composition
- `components/module-manager.tsx` toggles modules via `contexts/module-context.tsx`
- Each module can subscribe to the same real-time feeds and use domain helpers in `lib/`
- `contexts/portfolio-context.tsx` will be adapted to hydrate from DB and optimistically update while deferring to server state

## Environments
- Local: anonymous auth, local dev on Next.js; Supabase project or Supabase local dev (optional)
- Staging: feature validation, synthetic ticks
- Production: tuned Realtime and matching frequency; monitoring and usage analytics

## Observability & Reliability
- Client: lightweight logging for subscription lifecycle and RPC errors
- DB: Postgres logs, query performance; Supabase dashboard
- Future: add error tracking (Sentry) and simple feature analytics

## Security & Integrity
- RLS ensures users can only see/modify their own portfolio, holdings, orders
- Server authoritative updates for money/positions; no client-side cash math beyond temporary optimistic states

## Incremental Adoption Plan
- Step 1: Keep current UI, add session, add DB helpers, document schema (done)
- Step 2: Migrate portfolio/order flows to RPC + realtime (minimal UI changes)
- Step 3: Introduce tick generator + simple matching; subscribe to ticks; leaderboards from aggregate views
- Step 4: Add social features, chat/presence, and advanced order types
