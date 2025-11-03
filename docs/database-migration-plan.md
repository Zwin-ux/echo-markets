# Database Migration Plan: Moving Away from Supabase

## Overview
This document outlines the migration strategy for Echo Markets from Supabase to alternative database solutions.

## Current Supabase Dependencies
- Real-time subscriptions (orders, trades, ticks)
- PostgreSQL database with RPC functions
- Authentication (if used)
- Row Level Security (RLS)
- Background scripts (ticker, order matcher, narrator)

## Recommended Migration Path: PostgreSQL + Prisma

### Phase 1: Database Setup
1. **Choose Provider**: Neon, Railway, or PlanetScale
2. **Setup Prisma**: Replace Supabase client with Prisma
3. **Schema Migration**: Convert Supabase schema to Prisma schema
4. **Environment Variables**: Update all env vars

### Phase 2: API Layer Refactor
1. **Database Client**: Create abstracted database client
2. **Real-time System**: Implement WebSocket or SSE solution
3. **Background Scripts**: Update all engine scripts
4. **API Routes**: Migrate from Supabase RPC to Next.js API routes

### Phase 3: Testing & Deployment
1. **Local Development**: Test with new database
2. **Migration Scripts**: Data migration if needed
3. **Production Deployment**: Deploy to chosen platform

## Alternative Solutions Comparison

### Option 1: PostgreSQL + Prisma + Neon
**Pros:**
- Familiar PostgreSQL syntax
- Excellent TypeScript support with Prisma
- Generous free tier with Neon
- Built-in connection pooling

**Cons:**
- Need to implement real-time separately
- More setup complexity

**Best for:** Production-ready applications with complex queries

### Option 2: MongoDB + Mongoose + Atlas
**Pros:**
- Flexible schema design
- Built-in change streams for real-time
- Excellent free tier
- Simple deployment

**Cons:**
- Different query syntax
- Less strict typing

**Best for:** Rapid prototyping and flexible data models

### Option 3: SQLite + Turso
**Pros:**
- Ultra-fast queries
- Edge deployment
- Simple setup
- Cost-effective

**Cons:**
- Newer ecosystem
- Limited complex queries

**Best for:** High-performance applications with simple data models

## Implementation Timeline

### Week 1: Setup & Schema
- [ ] Choose database provider
- [ ] Setup Prisma/Mongoose
- [ ] Create database schema
- [ ] Update environment variables

### Week 2: Core Migration
- [ ] Replace database client
- [ ] Migrate API routes
- [ ] Update background scripts
- [ ] Implement real-time system

### Week 3: Testing & Polish
- [ ] Test all functionality
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Production deployment

## Files to Update

### Core Database Files
- `lib/supabase.ts` → `lib/database.ts`
- `lib/supabase-server.ts` → `lib/database-server.ts`
- `lib/db.ts` → Update with new client

### Background Scripts
- `scripts/dev-ticker.mjs`
- `scripts/order-matcher.mjs`
- `scripts/narrator.mjs`
- `scripts/closing-bell.mjs`

### Configuration
- `package.json` - Remove Supabase, add new dependencies
- `.env.local.example` - Update environment variables
- Next.js API routes - Replace Supabase calls

## Environment Variables Mapping

### Current (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### New (PostgreSQL + Prisma)
```
DATABASE_URL=
DIRECT_URL= # For migrations
WEBSOCKET_URL= # For real-time
```

### New (MongoDB + Atlas)
```
MONGODB_URI=
MONGODB_DB_NAME=
```

## Next Steps
1. Choose your preferred database solution
2. Set up development environment
3. Begin Phase 1 implementation
4. Test thoroughly before production deployment