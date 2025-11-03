# Echo Markets Database Migration Action Plan

## 🎯 Goal
Migrate Echo Markets from Supabase to a self-hosted database solution while maintaining all functionality.

## 📋 Pre-Migration Checklist

### 1. Choose Your Database Provider
- [ ] **PostgreSQL + Prisma + Neon** (Recommended for production)
- [ ] **MongoDB + Mongoose + Atlas** (Good for rapid development)
- [ ] **SQLite + Turso** (Best for performance/cost)

### 2. Set Up Database Infrastructure
- [ ] Create database instance (Neon/Atlas/Turso account)
- [ ] Note connection strings and credentials
- [ ] Test database connectivity

### 3. Backup Current Data (if any)
- [ ] Export existing Supabase data
- [ ] Document current schema structure
- [ ] Save environment variables

## 🚀 Migration Steps

### Phase 1: Database Setup (Day 1)
```bash
# 1. Run the migration script
node scripts/migrate-database.mjs postgresql  # or mongodb/sqlite

# 2. Update environment variables
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# 3. Test database connection
npm run build
```

### Phase 2: Code Migration (Day 2-3)

#### Replace Database Client
- [ ] Update `lib/db.ts` to use new database client
- [ ] Replace Supabase calls with new database operations
- [ ] Update type definitions

#### Update Background Scripts
- [ ] `scripts/dev-ticker.mjs` - Replace Supabase client
- [ ] `scripts/order-matcher.mjs` - Update order matching logic
- [ ] `scripts/narrator.mjs` - Update trade analysis
- [ ] `scripts/closing-bell.mjs` - Update market closing logic

#### Update API Routes
- [ ] Replace Supabase RPC calls with direct database queries
- [ ] Update authentication if using Supabase Auth
- [ ] Test all API endpoints

### Phase 3: Real-time Features (Day 4)
- [ ] Implement WebSocket server or SSE for real-time updates
- [ ] Update frontend to connect to new real-time system
- [ ] Test order updates, price feeds, and trade notifications

### Phase 4: Testing & Deployment (Day 5)
- [ ] Run comprehensive tests
- [ ] Performance testing with simulated load
- [ ] Deploy to production environment
- [ ] Monitor for issues

## 📁 Files to Update

### Core Database Files
```
lib/supabase.ts → lib/database.ts
lib/supabase-server.ts → lib/database-server.ts
lib/db.ts → Update with new client
```

### Background Scripts
```
scripts/dev-ticker.mjs
scripts/order-matcher.mjs
scripts/narrator.mjs
scripts/closing-bell.mjs
```

### Configuration
```
package.json - Dependencies
.env.local - Environment variables
next.config.mjs - Build configuration
```

## 🔧 Implementation Commands

### PostgreSQL + Prisma
```bash
# Install dependencies
npm install prisma @prisma/client
npm install -D prisma

# Initialize and migrate
npx prisma init
npx prisma migrate dev --name init
npx prisma generate

# Update package.json scripts
npm pkg set scripts.db:migrate="prisma migrate dev"
npm pkg set scripts.db:generate="prisma generate"
npm pkg set scripts.db:studio="prisma studio"
```

### MongoDB + Mongoose
```bash
# Install dependencies
npm install mongoose
npm install -D @types/mongoose

# No migration needed - schemas are defined in code
```

### SQLite + Turso
```bash
# Install dependencies
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit

# Configure Drizzle
npx drizzle-kit generate:sqlite
npx drizzle-kit push:sqlite
```

## 🌐 Deployment Options

### Option 1: Vercel + Neon (PostgreSQL)
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# DATABASE_URL, DIRECT_URL
```

### Option 2: Railway (Full-stack)
```bash
# Deploy to Railway
railway login
railway link
railway up

# Railway automatically detects Next.js and PostgreSQL
```

### Option 3: Render + MongoDB Atlas
```bash
# Deploy to Render
# Connect GitHub repo
# Set environment variables: MONGODB_URI
```

## ⚠️ Important Notes

### Data Migration
- If you have existing data in Supabase, export it before migration
- Create seed scripts to populate new database with test data
- Consider running both systems in parallel during transition

### Environment Variables
- Update all team members' local `.env.local` files
- Update production environment variables
- Remove old Supabase credentials

### Real-time Features
- Supabase real-time subscriptions need to be replaced
- Consider WebSocket server or Server-Sent Events
- Test thoroughly as this is the most complex part

### Performance Considerations
- Database connection pooling (handled by Prisma/Mongoose)
- Query optimization for portfolio calculations
- Caching strategy for frequently accessed data

## 🆘 Troubleshooting

### Common Issues
1. **Connection errors**: Check DATABASE_URL format and credentials
2. **Migration failures**: Ensure database is empty before first migration
3. **Type errors**: Regenerate Prisma client after schema changes
4. **Real-time not working**: Check WebSocket server is running

### Rollback Plan
1. Keep Supabase credentials in separate env file
2. Maintain git branch with Supabase code
3. Have database backup ready
4. Document all changes for quick reversal

## 📞 Support Resources

### PostgreSQL + Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)

### MongoDB + Mongoose
- [Mongoose Documentation](https://mongoosejs.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

### SQLite + Turso
- [Turso Documentation](https://docs.turso.tech)
- [Drizzle Documentation](https://orm.drizzle.team)

---

**Ready to start?** Choose your database provider and run:
```bash
node scripts/migrate-database.mjs [postgresql|mongodb|sqlite]
```