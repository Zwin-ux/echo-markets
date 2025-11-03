# Project Structure & Organization

## Directory Layout
```
/app                    # Next.js App Router pages
  /api                  # API routes
  /onboarding          # User onboarding flow
  layout.tsx           # Root layout with context providers
  page.tsx             # Main dashboard page

/components             # React components
  /auth                # Authentication components
  /dashboard           # Dashboard-specific components
  /onboarding          # Onboarding flow components
  /ui                  # Reusable UI primitives (shadcn/ui)
  *-module.tsx         # Feature modules (trading, portfolio, etc.)

/contexts              # React Context providers
  *-context.tsx        # Global state management

/hooks                 # Custom React hooks
/lib                   # Utility functions and configurations
/scripts               # Background engine scripts
/tests                 # Test files organized by type
  /unit               # Unit tests
  /integration        # Integration tests
  /e2e                # End-to-end tests

/docs                  # Documentation
  /architecture        # Technical architecture docs
  /database           # Database schema, migrations, and seeds
```

## Naming Conventions
- **Components**: PascalCase (e.g., `TradingModule`, `UserProfile`)
- **Files**: kebab-case for components (e.g., `trading-module.tsx`)
- **Contexts**: Descriptive names ending in `-context.tsx`
- **Hooks**: Start with `use-` prefix (e.g., `use-mobile.tsx`)
- **Types**: PascalCase, often co-located with components

## Module System
Standardized module IDs for the modular architecture:
- `terminal`, `charts`, `news`, `portfolio`, `trading`
- `leaderboard`, `narrator`, `simulation`, `education`
- `bookmarks`, `social`, `alerts`

Each module follows the pattern: `{module-id}-module.tsx`

## Code Organization Patterns
- **Context Providers**: Nested in root layout for dependency injection
- **UI Components**: Atomic design with Radix UI primitives
- **State Management**: Context + useReducer for complex state
- **API Layer**: Centralized in `/lib` with database client abstraction
- **Styling**: Utility-first with Tailwind, custom CSS variables for theming