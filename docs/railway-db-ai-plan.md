# Echo Markets Data & AI Integration Plan

## Goal
Establish persistent game state and generative narrative services so Echo Markets can run as a live cultural market on Railway. The plan covers two pillars:

1. **Railway-managed PostgreSQL database** for durable player, market, and narrative state.
2. **LLM socket service** that streams large-language-model (LLM) generated beats, rumors, and responses into the game loop using Railway-provided OpenAI credentials.

## Current Baseline
- Prisma models already define core trading entities (`User`, `Order`, `Holding`, `Trade`, `Narrative`, etc.) backed by PostgreSQL via `DATABASE_URL` and `DIRECT_URL` environment variables.【F:prisma/schema.prisma†L1-L210】
- Frontend screens simulate market/narrative behavior in-memory; there is no persistence or real-time AI narrative source.
- Deployment documentation targets static hosting; it does not yet provision data services or background workers.【F:DEPLOYMENT.md†L1-L62】

## Pillar A – Railway PostgreSQL Integration

### Functional Scope
- Persist player identity, portfolios, and social graph using existing Prisma models.
- Record daily market snapshots, narrative beats, faction votes, and community impulse triggers.
- Support read-heavy leaderboard/analytics queries and write-heavy trading activity.

### Data Model Additions
Augment `schema.prisma` with purpose-built tables:
- `MarketSnapshot` – end-of-tick aggregate metrics (open/high/low/close, sentiment, volatility) per symbol.
- `NarrativeBeat` – authored and AI-generated story beats linked to symbols and vote windows.
- `NarrativeVote` – per-user votes on forks, carrying influence weight.
- `CommunityImpulse` – records triggered hype/panic events, with metadata about initiator, affected symbols, and cooldown windows.
- `InfluenceLedger` – immutable log of influence gains (accuracy, timing, cultural resonance) to back user rankings and socket weighting.
- `Rumor` – transient gossip surfaced by the LLM, including decay timestamps and confidence scores.

### Implementation Steps
1. **Prisma Schema**
   - Extend `schema.prisma` with the new models and relationships.
   - Run `pnpm prisma migrate dev --name add-narrative-and-impulse` locally; commit migrations.
2. **Environment Variables**
   - Define `DATABASE_URL` and `DIRECT_URL` in Railway service variables using the generated PostgreSQL connection strings.
   - Optionally add `SHADOW_DATABASE_URL` for safe migration pipelines.
3. **Runtime Configuration**
   - Create `lib/db.ts` that exports a singleton Prisma client with connection reuse for serverless builds.
   - Update API route handlers (e.g., `app/api/orders`, `app/api/narratives`) to use Prisma instead of mock data.
4. **Background Jobs**
   - Add a `scripts/seed.ts` for initial factions, starter equities, and lore.
   - Implement cron-style Railway tasks for nightly settlement (portfolio resets, influence decay) using `pnpm tsx scripts/settle.ts`.
5. **Caching & Performance**
   - Introduce Redis (Railway Add-on) or in-memory caching for hot leaderboards and price feeds.
   - Use Prisma `@@index` hints to optimize expected queries (already present for core models).【F:prisma/schema.prisma†L14-L210】

### DevOps Notes
- Ensure `pnpm prisma generate` runs in build phase (add to `package.json` `postinstall`).
- Document local development using `docker compose` or Railway CLI port forwarding for DB access.
- Add health checks for migrations and data seeding in deployment pipeline.

## Pillar B – LLM Socket Service

### Objectives
- Deliver streaming narrative content, rumor generation, and market sentiment cues from an OpenAI-compatible LLM.
- Allow players to interact with the LLM (ask analysts, trigger lore) via WebSocket channels.
- Feed AI outputs back into the market simulation (price nudges, impulse triggers, quest generation).

### Architecture
1. **Dedicated Railway service** running a Node.js or Bun process that brokers socket traffic.
2. **Namespaces/Channels**
   - `market-feed`: AI commentary reacting to price movements and votes.
   - `rumor-mill`: short-form rumors with decay timers; clients subscribe per symbol/faction.
   - `analyst-desk`: two-way chat where top-influence users can request insights.
3. **Message Schema**
   - Include `type`, `symbol`, `faction`, `urgency`, `influenceWeight`, `expiresAt`, and `llmTraceId` for observability.
4. **Interaction Flow**
   - Frontend emits domain events (trades, votes, impulses) via REST/WebSocket to the service.
   - Socket service enriches context with database lookups (influence weights, current narratives).
   - Service calls OpenAI (`gpt-4.1` or similar) using Railway-provided `OPENAI_API_KEY`, streams results to subscribed clients, and writes summaries to `NarrativeBeat`/`Rumor` tables.

### Implementation Steps
1. **Service Skeleton**
   - Create `services/llm-socket` package with Fastify or Express + `ws` (or `socket.io`).
   - Add `LLM_SOCKET_URL` env var to frontend for connection.
2. **Context Builders**
   - Implement middleware to fetch latest market/narrative context from Prisma for prompts.
   - Cache heavy context (e.g., top traders) for 30–60 seconds to control costs.
3. **Prompt Templates**
   - Store structured prompt files describing tone (“culturally loud, gossip-driven”), desired output JSON schema, and fallback responses.
   - Support tool-calls for `applyMarketImpulse` to push data into `CommunityImpulse` table when AI suggests big moves.
4. **Security & Governance**
   - Require signed JWT (NextAuth session) when connecting to the socket; include influence weight claim.
   - Rate-limit requests per user and per channel.
   - Log prompts/responses to `Rumor`/`NarrativeBeat` tables for audit.
5. **Testing & Observability**
   - Add Jest tests for socket handlers (mock OpenAI) and for Prisma integration.
   - Instrument with OpenTelemetry spans and push to Railway logs.

### Client Integration
- Replace mock narrative ticker on `app/game/page.tsx` with socket listeners for `market-feed` and `rumor-mill` events.
- Dispatch Redux/Context updates to animate market reactions and store AI-sourced beats in the DB.
- Provide UI affordances (buttons) for triggering AI queries that call the socket emit endpoints.

## Milestones & Sequencing
1. **Foundations** – Configure Railway PostgreSQL, migrate schema, wire Prisma client, seed baseline data.
2. **Gameplay Persistence** – Hook up trading, votes, and impulses to DB-backed API routes.
3. **LLM Socket MVP** – Deploy socket service, stream AI-generated narrative beats into the UI, log to DB.
4. **Advanced Influence Loop** – Calculate influence scores from DB events, adjust socket output weighting, expose leaderboards.
5. **Operational Hardening** – Add monitoring, automated tests, and failover strategies for DB + LLM services.

## Deliverables
- Updated Prisma schema + migrations.
- Backend scripts/routes for persistence and AI interactions.
- Railway deployment docs covering DB provisioning, environment variables, socket service deployment, and observability hooks.
- QA checklist for database integrity, socket reliability, and AI response safety.
