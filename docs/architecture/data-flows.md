# Data Flows

This document captures end-to-end flows between client and backend.

## Session Initialization
1) App loads `app/layout.tsx` → `SessionBootstrap`
2) `ensureAnonSessionAndInit()`:
   - `supabase.auth.getSession()`; if none → `signInAnonymously()`
   - `rpc('init_user')` ensures `profiles` and `portfolios` exist

## Place Order
1) UI `components/trading-module.tsx` captures inputs
2) Client calls `lib/db.placeOrder()` → `rpc('place_order')`
3) DB inserts into `orders` (status=open)
4) Matching job updates `orders` (filled/cancelled), inserts `trades`, updates `holdings` and `portfolios`
5) Realtime broadcasts `orders/trades` changes → UI updates via subscriptions; `events.emit('orders:changed'|'trades:new')`

## Ticks Generation
1) Cron/job inserts rows into `ticks` (symbol, price, ts)
2) Realtime broadcasts `INSERT` events → Subscribed modules receive updates
3) Portfolio PnL/leaderboard calculations consume ticks (either client derived or server aggregates)

## Leaderboard Update
1) Aggregation job/materialized view computes ranks and PnL snapshots
2) Writes result to `leaderboards`
3) Realtime broadcasts → UI updates

## Error Paths
- RPC errors surfaced with toast + console logs
- Subscription errors cause auto-resubscribe or UI fallback
