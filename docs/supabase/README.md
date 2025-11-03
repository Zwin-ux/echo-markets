# Echo Markets — Supabase Setup Guide

This guide sets up Supabase for auth, Postgres, and realtime to power MMO features.

## 1) Create a Supabase project
- Go to https://supabase.com and create a project.
- Get your Project URL and anon public key from Project Settings → API.

## 2) Configure environment variables
Create a `.env.local` in the project root using the example file:

```
cp .env.local.example .env.local
```

Set values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (local dev only, for ticker script)
 - `STARTING_CASH` (optional, default `1000`; set to `100` if you want the daily $100 loop)

## 3) Apply the database schema
Open the SQL Editor in Supabase and run the contents of:
- `docs/supabase/schema.sql`

This creates:
- Enums: `order_side`, `order_type`, `order_status`
- Tables: `profiles`, `portfolios`, `holdings`, `orders`, `trades`, `ticks`, `leaderboards`
- View: `v_user_portfolio`
- RLS policies and basic RPC: `init_user`, `place_order`, `cancel_order`

## 4) Enable Realtime
In Database → Replication → Publication, enable Realtime for these tables:
- `orders`, `trades`, `ticks`, `leaderboards`

## 5) Auth flow
Start with Anonymous or Magic Link (email). Minimal client code expects a session to call RPCs.

## 6) Local development
Install deps and run dev server:
```
npm install
npm run dev
```

Optional: generate live price ticks locally (every 2s) so the UI receives realtime updates:
```
npm run dev:ticker
```

Optional: fill open orders server-side against latest ticks (simple market maker):
```
npm run engine:orders
```

## 7) Production
- Add the environment variables to Netlify/Vercel site settings.
- Ensure Realtime is enabled for the listed tables.
- Optional: add a scheduled function (cron) to generate `ticks` (price updates) periodically.

The app mounts a realtime bridge component that translates database changes into client events, so modules can react to `ticks:new`, `orders:changed`, and `trades:new` without coupling to Supabase APIs directly.

## 8) Next client tasks
- Wire `lib/supabase.ts` into contexts and modules.
- Migrate portfolio/order operations to RPCs and subscribe to realtime updates.
- Replace mock data with `ticks` stream.
