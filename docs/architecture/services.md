# Services and Responsibilities

This document outlines the backend service boundaries and responsibilities for the MMO market game.

## Services (Phase 1)
- Price Tick Generator (Cron/Job)
  - Generates synthetic ticks per symbol at a configured cadence
  - Writes to `public.ticks`
  - Optionally emits indicator values later
- Matching Engine (Job / RPC-driven)
  - Maintains in-DB order book state (via SQL queries)
  - Matches orders FIFO per symbol; supports market/limit orders
  - Writes trade executions to `public.trades`
  - Updates `public.orders` status and user `public.holdings`/`public.portfolios`
- Aggregators
  - Leaderboards (daily PnL) materialized via SQL or nightly job

## Services (Phase 2+)
- Dedicated Matching Engine Worker
  - Stateful in-memory books per symbol for performance
  - Consumes orders from queue (e.g., table-triggered or pub/sub)
  - Publishes trades to DB and realtime channel
- Social/Presence Service
  - Chat, rooms, presence channels for lobbies
- Analytics/Telemetry
  - Usage events, funnel metrics, error tracking

## Interfaces
- RPC Functions (place/cancel order, init user)
- Realtime tables/channels (ticks, orders, trades, leaderboards)
- REST (optional): Public read endpoints for leaderboards or tick snapshots

## Configuration
- Symbol universe (AAPL, MSFT, TSLA, NVDA, AMZN, GOOGL)
- Tick cadence per environment (fast in staging, tuned in prod)
- Risk limits (max order size, position limits, daily cash reset policy)

## Deployment
- Netlify for Next.js app
- Supabase for DB/Auth/Realtime/RPC
- Scheduled functions for ticks (via Supabase schedules or external cron)
