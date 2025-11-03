# Technology Stack & Build System

## Core Technologies
- **Framework**: Next.js 15.2.4 with App Router
- **Runtime**: React 19 with TypeScript 5
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Database**: PostgreSQL with Prisma ORM (configurable provider)
- **Real-time**: WebSockets with Socket.io or Server-Sent Events
- **State Management**: React Context API for global state
- **Testing**: Jest with React Testing Library and jsdom
- **Package Manager**: npm (with pnpm-lock.yaml present)

## Key Libraries
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization  
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animate
- **Utilities**: clsx, tailwind-merge, date-fns, lodash.debounce
- **Notifications**: Sonner for toast messages

## Development Commands
```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Testing
npm test                    # Run Jest tests
npx jest --runInBand       # Run tests sequentially

# Linting
npm run lint

# Engine scripts (background services)
npm run dev:ticker         # Market price updates
npm run engine:orders      # Order matching engine
npm run engine:narrator    # Market commentary
npm run engine:close       # Market closing bell
```

## Build Configuration
- **TypeScript**: Strict mode enabled with path aliases (@/*)
- **Next.js**: ESLint/TypeScript errors ignored during builds for rapid development
- **Images**: Unoptimized for static export compatibility
- **Experimental**: Webpack build workers and parallel compilation enabled