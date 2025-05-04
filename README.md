

# Echo Markets

A virtual stock market simulation platform with real-time trading, portfolio management, leaderboards, news, and more. Designed for extensibility, education, and fun.

---

## Key Features
- trading with market and limit order support
- Virtual stock market with multiple markets and news
- Real-time leaderboards and achievements
- Portfolio management with holdings, watchlist, and order history
- Modular system for easy extension (charts, simulation, education, etc.)

## Technical Stack
- Next.js 15.1.0
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components

## Module System
Standardized module IDs:
```
terminal, charts, news, portfolio, trading, leaderboard, narrator, simulation, education, bookmarks, social, alerts
```

Core modules (terminal, charts, news, portfolio, trading, leaderboard, narrator, simulation) are at least beta quality.

---

## Recent Improvements
### Limit Order Functionality
- **Place, execute, and cancel limit orders** (buy/sell)
- **UI:** Unified limit order management in both trading and portfolio modules
- **Order processing:** Automatic fills based on market price updates
- **Edge-case handling:** Insufficient funds/shares, duplicate orders, cancelling filled/cancelled orders
- **User feedback:** Toast notifications for all actions

### Portfolio & Trading Module Enhancements
- Consistent table views for holdings, orders, and watchlist
- Limit order tab in portfolio for easy management
- Improved error handling and validation throughout

### Unit Testing & Code Quality
- **Extensive unit tests** for portfolio context, including:
  - Limit order placement, execution, and cancellation
  - Edge cases (insufficient funds, duplicate/cancelled orders, state transitions)
- Jest-based testing infrastructure
- Mocks for localStorage and toast notifications
- TypeScript lint/type fixes for robust codebase

### Linting & Type Safety
- Fixed all outstanding lint/type errors (GameEventType, context usage, etc.)
- Improved code clarity and maintainability

---

## How to Contribute & Test
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Run unit tests:**
   ```bash
   npx jest --runInBand
   ```
4. **Build for production:**
   ```bash
   npm run build
   ```

---

## GitHub Repository Initialization
To push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [YOUR_REPO_URL]
git push -u origin main
```

---

## Roadmap / Future Focus Areas
- Performance optimizations (virtualized rendering, code splitting)
- Advanced trading features (historical backtesting, indicators)
- Social features (profiles, trade sharing, following)
- Educational content (tutorials, quizzes)
- Mobile-first experience

---

## License
MIT


