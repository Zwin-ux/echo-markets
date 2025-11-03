# Echo Markets – Engineering Specification (MVP and First Scale)

## 0. Purpose

Echo Markets is an always-on browser MMO about manipulating fake markets. Players trade fictional assets. Prices move from:

* Player activity (buy/sell pressure)
* Narrative events (scandals, hype, leaks)
* Social meta (factions, influencers, media posts we script)

Goal: ship fast, run cheap, feel alive in real time.

This spec is for engineers and AI coding assistants. It defines:

* Core game loop
* Data model
* Realtime pipeline
* API surface
* Security / anti-cheat basics
* Deployment plan

Codex / Claude / Windsurf should follow this when generating code.

---

## 1. High-level System Architecture

### 1.1 Frontend

* Next.js 15 (App Router)
* React 19
* Tailwind CSS
* Zustand or Redux for client state
* Runs on Vercel

Responsibilities:

* Auth UI (login / username claim)
* Trading UI (buy / sell / portfolio)
* Live Market Screen (tickers, charts, breaking events)
* Leaderboard / rich player profiles
* Faction / drama surface later (not MVP)

### 1.2 Backend

We want free / cheap. We will not build heavy infra first.

Phase 1 backend = PocketBase:

* Auth
* Collections = our tables
* Realtime subscriptions (WebSocket)
* Self host on low-cost service (Railway/Fly.io/Render)

Phase 2 backend (swap path) = Appwrite or custom Node + Postgres once concurrency and data volume go up.

Why PocketBase first:

* Zero-cost dev
* Built-in realtime
* Simple REST API + realtime channels = fast to wire into Next.js
* Good for <= few thousand DAU

### 1.3 Game Logic Layer

Game logic lives in a Node/TypeScript service we control. It can start as a simple Next.js API route or a cron-style background task that runs inside the PocketBase server environment.

Responsibilities:

* Price ticks
* Event injection ("Company X under investigation", "CEO leaked DMs")
* Cooldowns / throttles for trades

We call this the **Market Engine**.

---

## 2. Core Game Loop

1. Player logs in.
2. Player sees current market board: each "ticker" is a fictional company, meme coin, faction, scandal, etc.
3. Player buys or sells shares using in-game currency.
4. Their trades instantly change:

   * Their balance and holdings
   * Global order pressure for that ticker
5. Market Engine periodically updates prices based on pressure + scripted events.
6. Leaderboard updates in realtime based on net worth.
7. Social layer: feed shows latest whale trades and fake news drops.

Target player feeling: "My actions move the world" even with 20 users online.

---

## 3. Data Model (PocketBase Collections)

We model this with simple collections. All IDs are UUIDs.

### 3.1 users

* id
* username (unique)
* balance (number)
* total_net_worth (number) [denormalized for leaderboard]
* created_at
* updated_at

### 3.2 tickers

Represents a tradable asset.

* id
* symbol (e.g. "HYPE", "GOVFAIL", "SUNNY.AI")
* name (string)
* description (string, for lore)
* current_price (number)
* volatility (number 0..1) controls how reactive this thing is
* sentiment (number -100..100)
* created_at
* updated_at

### 3.3 holdings

A position that a user owns.

* id
* user_id
* ticker_id
* shares (number)
* avg_cost (number)
* updated_at

### 3.4 trades (append only)

Audit trail for transparency and replay.

* id
* user_id
* ticker_id
* side ("BUY" | "SELL")
* shares (number)
* price_exec (number)
* timestamp

### 3.5 events

Narrative and system-driven events that influence price.

* id
* ticker_id (nullable if global event like "market panic")
* headline (string)
* body (text)
* impact_type ("PUMP" | "DUMP" | "PANIC" | "HYPE")
* magnitude (number, 0..100)
* created_at
* expires_at (optional)

### 3.6 market_state (singleton row or config collection)

Global knobs controlled by Market Engine.

* trading_enabled (bool)
* tick_interval_ms (number)
* last_tick_at (timestamp)

Note: PocketBase collections map 1:1 to REST endpoints and realtime channels. Frontend can subscribe to `tickers`, `events`, `leaderboard`.

---

## 4. Price Update Logic (Market Engine)

We do not need real finance math. We need believable motion.

Per ticker on each tick:

1. Gather buy volume vs sell volume in last N seconds.
2. Compute pressure = (buy_volume - sell_volume) / liquidity_scalar.
3. Compute narrative push from active events affecting that ticker.
4. NewPrice = OldPrice * (1 + pressure * k1 + narrative_push * k2 + noise).
5. Clamp NewPrice to stay > 0 and within sane bounds.
6. Write back `current_price` in `tickers`.
7. Recalculate each user total_net_worth and push leaderboard.

This loop runs on interval (ex: every 5 seconds) on the backend side, not client side.

Security note: Price authority must be server-only. Clients never set price.

---

## 5. Trading Flow (Buy / Sell)

### Request

Client -> API route `/api/trade` with:

* user_id
* ticker_id
* side (BUY | SELL)
* shares_requested

### Steps server performs

1. Load user, ticker, holding.
2. Price snapshot = ticker.current_price.
3. If BUY:

   * cost = shares_requested * price_snapshot
   * if user.balance < cost reject
   * decrement balance
   * increment holding.shares and recompute avg_cost
4. If SELL:

   * if holding.shares < shares_requested reject
   * increment balance by shares_requested * price_snapshot
   * decrement holding.shares
5. Insert into `trades` table.
6. Return updated balance, holding, and execution price.

### Realtime

* PocketBase broadcasts changes to `holdings`, `users`, `tickers`, `trades`.
* Frontend listens and updates UI with no reload.

Anti-spam basic:

* cooldown: user cannot send >N trades per second.
* max_shares per trade.

---

## 6. Leaderboard Logic

Goal: show "who is winning the economy" in realtime.

For each user:
`total_net_worth = balance + SUM(holding.shares * ticker.current_price)`

We can:

* Recompute on every tick (cheap with small user count)
* Store to `users.total_net_worth`
* Expose `/api/leaderboard` sorted DESC by total_net_worth
* Push updates through realtime channel so leaderboard animates live

Later optimization:

* Move to background worker if user count grows.

---

## 7. Event / Narrative System

We artificially inject drama to keep the world moving.

Types of events:

* Pump ("Influencer A just endorsed Ticker X on stream")
* Dump ("Leaked lawsuit against Ticker Y")
* Panic ("Regulators raid HQ of Ticker Z")
* Global Shock ("Market fears new tax")

Impact modeling:

* Each event gets magnitude 0..100
* magnitude maps to a sentiment_delta and/or direct % push on price
* Events decay over time

Client UX:

* Events render in a live "News Feed" column
* Clicking an event highlights the affected ticker and shows a mini chart spike

Engineering note:

* Events are just rows in `events`
* Market Engine reads active events and folds them into price math

---

## 8. Realtime Transport

PocketBase already exposes realtime via WebSocket subscriptions.
Frontend pattern:

* On page load, client subscribes to `tickers` collection for `current_price` changes
* Also subscribe to `events` for new headlines
* Also subscribe to `users` for self balance/portfolio, or `leaderboard` view (can be derived)

If PocketBase realtime is not enough under load:

* We can add a Next.js route using `socket.io` or `ws` server that mirrors PocketBase changes and batches updates for clients.

For MVP we do not overbuild. Use PocketBase native.

---

## 9. Security / Anti-cheat

We assume people will try to:

* Call trade API directly and mint free money
* Force negative prices
* Spam infinite trades per second
* Manipulate other users' balances

Minimum rules at MVP:

1. All write operations (balance edits, holdings edits, ticker price edits) happen server-side only. Client never writes these fields directly.
2. Per-user rate limit on `/api/trade`.
3. Validation that user_id in request matches authenticated session.
4. Server rejects any trade that would make balance negative or shares negative.
5. Price authority = Market Engine only. Client can't set `ticker.current_price`.
6. Expose all trades publicly (an audit log UI). Public logs discourage silent abuse.

Later:

* IP/device throttling
* Soft bans
* Shadow markets for suspected bots

---

## 10. Deployment Plan

### Frontend

* Next.js deployed on Vercel (free tier first)

### Backend runtime

Option A (preferred MVP):

* PocketBase container deployed on Railway / Fly.io free tier
* Single region close to core users (US)

Option B (later scale):

* Appwrite or custom Node.js + Postgres on Render / Supabase-tier infra

### Env layout

* `web/` Next.js app
* `backend/` PocketBase instance config + seed scripts
* Optional: `engine/` Node worker for Market Engine tick loop

The engine can run using a cheap background worker container that wakes on interval.

---

## 11. API Surface (MVP)

These will be implemented as Next.js Route Handlers or server actions that talk to PocketBase.

### POST /api/trade

Body:

* ticker_id
* side (BUY | SELL)
* shares
  Auth:
* session token / user id
  Response:
* success: true/false
* execution_price
* new_balance
* new_position { shares, avg_cost }
* error (optional)

### GET /api/portfolio

Returns balance, positions, unrealized P/L.

### GET /api/market

Returns current tickers list with price, change %.

### GET /api/leaderboard

Returns top N users by net worth.

### GET /api/feed

Returns latest N trades + events in time order.

---

## 12. Screens / UI we need to build

1. **Market Screen (Home)**

   * Ticker table with live prices and % change
   * Buy/Sell modal
   * News/Event feed side panel

2. **Portfolio Screen**

   * Holdings list (shares, avg cost, current value)
   * Cash balance
   * Unrealized profit/loss

3. **Leaderboard Screen**

   * Top players ranked by net worth
   * Click player to view profile

4. **Player Profile Screen**

   * Username, join date
   * Net worth chart over time (later)
   * Visible recent trades (transparency culture)

5. **Auth / Onboarding**

   * Claim username
   * Get starter balance

Each screen should be minimal and readable. No bubbly emoji aesthetic. More like a terminal / finance dashboard hybrid.

---

## 13. Roadmap by Phase

### Phase 1: Core loop online

* Auth + starter balance
* Trading works end to end
* Prices move every X seconds from Market Engine
* Live ticker board updates without refresh
* Leaderboard visible

### Phase 2: Narrative market

* Fake news events injected
* Sentiment affects price movement
* Public feed that shows "whale" actions and scandals

### Phase 3: Social game

* Factions / teams / alliances
* Player-created pump attempts and smear campaigns
* Scheduled market crises

---

## 14. Guidance for AI Coding Assistants (Codex / Claude / etc.)

When generating code for Echo Markets:

1. Stack assumptions:

   * React 19 + Next.js App Router
   * Tailwind CSS
   * State store = Zustand unless told otherwise
   * Backend = PocketBase REST + realtime WebSocket
2. Never assume direct DB writes from client. All financial state changes must go through server actions or API routes.
3. Respect the data model in Section 3.
4. Expose clean TypeScript types for all DTOs.
5. Add rate limiting and basic validation in any trade endpoint.
6. UI theme: no emojis, no bubbly gradients. Style should feel like finance terminal or military HUD.
7. Realtime: subscribe to PocketBase collections for tickers/events and update UI reactively.
8. Prices are authoritative from server. Client never calculates global price.
9. Include TODO comments where production hardening is needed.

---

## 15. Open Questions / Next Decisions

* Currency model: Do we allow infinite respawn cash daily to keep it casual, or is money scarce and meaningful?
* Do we allow short selling in MVP, or keep only long buys to simplify logic?
* Should usernames and trades be public by default to drive drama, or do we need privacy at first for onboarding comfort?
* How are bans handled? Soft lock (no trading) vs account wipe.

We need answers before public alpha.

---

End of spec v1.0
Owner: Mazen Zwin
Date: 2025-10-28
