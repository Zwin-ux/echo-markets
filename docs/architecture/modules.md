# UI Modules Architecture

Echo Markets uses modular UI components that can be shown/hidden and combined:

- terminal: `components/terminal.tsx`
- trading: `components/trading-module.tsx`
- portfolio: `components/portfolio-module.tsx`
- charts: `components/chart-module.tsx`
- news: `components/news-feed-module.tsx`
- leaderboard: `components/leaderboard-module.tsx`
- narrator: `components/market-narrator.tsx`
- simulation: `components/simulation-module.tsx`

Module visibility is managed by `contexts/module-context.tsx`. Each module:
- Reads global state from contexts (user, portfolio, engine)
- Subscribes to realtime feeds through `lib/db.ts` (orders/trades/ticks)
- Uses shared domain types in `lib/types.ts`

## Module principles
- Single responsibility per module
- Stateless UI where possible; state in contexts
- Subscribe/unsubscribe on mount/unmount
- Avoid tight coupling between modules; communicate via contexts/events
