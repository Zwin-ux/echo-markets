#!/usr/bin/env node
// Database migration script - migrates from Supabase to chosen provider
// Usage: node scripts/migrate-database.mjs [postgresql|mongodb|sqlite]

import { config } from 'dotenv'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

const provider = process.argv[2] || process.env.DATABASE_PROVIDER || 'postgresql'

console.log(`🚀 Starting migration to ${provider}...`)

async function migrateToPostgreSQL() {
  console.log('📦 Installing PostgreSQL dependencies...')
  
  // Install Prisma
  const { execSync } = await import('child_process')
  execSync('npm install prisma @prisma/client', { stdio: 'inherit' })
  execSync('npm install -D prisma', { stdio: 'inherit' })
  
  console.log('🔧 Initializing Prisma...')
  execSync('npx prisma init', { stdio: 'inherit' })
  
  // Create Prisma schema
  const prismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String?
  cash       Float    @default(10000)
  created_at DateTime @default(now())
  
  orders   Order[]
  holdings Holding[]
  trades_as_buyer  Trade[] @relation("BuyerTrades")
  trades_as_seller Trade[] @relation("SellerTrades")
  
  @@map("users")
}

model Order {
  id          String      @id @default(cuid())
  user_id     String
  symbol      String
  side        OrderSide
  type        OrderType
  qty         Int
  limit_price Float?
  status      OrderStatus @default(OPEN)
  created_at  DateTime    @default(now())
  filled_at   DateTime?
  
  user User @relation(fields: [user_id], references: [id])
  
  @@map("orders")
}

model Holding {
  id       String @id @default(cuid())
  user_id  String
  symbol   String
  qty      Int
  avg_cost Float
  
  user User @relation(fields: [user_id], references: [id])
  
  @@unique([user_id, symbol])
  @@map("holdings")
}

model Tick {
  id        String   @id @default(cuid())
  symbol    String
  price     Float
  volume    Int
  timestamp DateTime @default(now())
  
  @@map("ticks")
}

model Trade {
  id         String   @id @default(cuid())
  symbol     String
  price      Float
  qty        Int
  buyer_id   String
  seller_id  String
  timestamp  DateTime @default(now())
  
  buyer  User @relation("BuyerTrades", fields: [buyer_id], references: [id])
  seller User @relation("SellerTrades", fields: [seller_id], references: [id])
  
  @@map("trades")
}

enum OrderSide {
  BUY
  SELL
}

enum OrderType {
  MARKET
  LIMIT
}

enum OrderStatus {
  OPEN
  FILLED
  CANCELLED
}
`
  
  // Write schema file
  const fs = await import('fs')
  fs.writeFileSync('prisma/schema.prisma', prismaSchema.trim())
  
  console.log('📋 Running Prisma migration...')
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  console.log('✅ PostgreSQL migration complete!')
  console.log('📝 Next steps:')
  console.log('1. Update your DATABASE_URL in .env.local')
  console.log('2. Run: npm run build')
  console.log('3. Test your application')
}

async function migrateToMongoDB() {
  console.log('📦 Installing MongoDB dependencies...')
  
  const { execSync } = await import('child_process')
  execSync('npm install mongoose', { stdio: 'inherit' })
  execSync('npm install -D @types/mongoose', { stdio: 'inherit' })
  
  console.log('✅ MongoDB dependencies installed!')
  console.log('📝 Next steps:')
  console.log('1. Set up MongoDB Atlas cluster')
  console.log('2. Update MONGODB_URI in .env.local')
  console.log('3. Update your database client to use Mongoose')
  console.log('4. Run: npm run build')
}

async function migrateToSQLite() {
  console.log('📦 Installing SQLite/Turso dependencies...')
  
  const { execSync } = await import('child_process')
  execSync('npm install drizzle-orm @libsql/client', { stdio: 'inherit' })
  execSync('npm install -D drizzle-kit', { stdio: 'inherit' })
  
  console.log('✅ SQLite/Turso dependencies installed!')
  console.log('📝 Next steps:')
  console.log('1. Set up Turso database')
  console.log('2. Update DATABASE_URL and DATABASE_AUTH_TOKEN in .env.local')
  console.log('3. Configure Drizzle schema')
  console.log('4. Run: npm run build')
}

async function removeSupabaseDependencies() {
  console.log('🧹 Removing Supabase dependencies...')
  
  const { execSync } = await import('child_process')
  execSync('npm uninstall @supabase/supabase-js', { stdio: 'inherit' })
  
  console.log('✅ Supabase dependencies removed!')
}

// Main migration flow
async function main() {
  try {
    await removeSupabaseDependencies()
    
    switch (provider) {
      case 'postgresql':
        await migrateToPostgreSQL()
        break
      case 'mongodb':
        await migrateToMongoDB()
        break
      case 'sqlite':
        await migrateToSQLite()
        break
      default:
        console.error(`❌ Unsupported provider: ${provider}`)
        console.log('Supported providers: postgresql, mongodb, sqlite')
        process.exit(1)
    }
    
    console.log('🎉 Migration completed successfully!')
    console.log('⚠️  Remember to update your background scripts and API routes')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()