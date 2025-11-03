# Database Implementation Examples

## Option 1: PostgreSQL + Prisma + Neon

### Setup Steps
```bash
# Install dependencies
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

### Environment Variables (.env.local)
```env
DATABASE_PROVIDER=postgresql
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Prisma Schema (prisma/schema.prisma)
```prisma
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
```

### Prisma Client Implementation
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Option 2: MongoDB + Mongoose + Atlas

### Setup Steps
```bash
# Install dependencies
npm install mongoose
npm install -D @types/mongoose
```

### Environment Variables (.env.local)
```env
DATABASE_PROVIDER=mongodb
MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/echo-markets?retryWrites=true&w=majority"
MONGODB_DB_NAME="echo-markets"
```

### Mongoose Schemas
```typescript
// lib/mongoose-schemas.ts
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  cash: { type: Number, default: 10000 },
  created_at: { type: Date, default: Date.now }
})

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  type: { type: String, enum: ['market', 'limit'], required: true },
  qty: { type: Number, required: true },
  limit_price: Number,
  status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },
  created_at: { type: Date, default: Date.now },
  filled_at: Date
})

const holdingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  qty: { type: Number, required: true },
  avg_cost: { type: Number, required: true }
})

const tickSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
})

const tradeSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now }
})

export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
export const Holding = mongoose.models.Holding || mongoose.model('Holding', holdingSchema)
export const Tick = mongoose.models.Tick || mongoose.model('Tick', tickSchema)
export const Trade = mongoose.models.Trade || mongoose.model('Trade', tradeSchema)
```

---

## Option 3: SQLite + Turso + Drizzle

### Setup Steps
```bash
# Install dependencies
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

### Environment Variables (.env.local)
```env
DATABASE_PROVIDER=sqlite
DATABASE_URL="libsql://your-database-url.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
```

### Drizzle Schema
```typescript
// lib/drizzle-schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  cash: real('cash').default(10000),
  created_at: text('created_at').default('CURRENT_TIMESTAMP')
})

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(), // 'buy' | 'sell'
  type: text('type').notNull(), // 'market' | 'limit'
  qty: integer('qty').notNull(),
  limit_price: real('limit_price'),
  status: text('status').default('open'), // 'open' | 'filled' | 'cancelled'
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  filled_at: text('filled_at')
})

export const holdings = sqliteTable('holdings', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  qty: integer('qty').notNull(),
  avg_cost: real('avg_cost').notNull()
})

export const ticks = sqliteTable('ticks', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  price: real('price').notNull(),
  volume: integer('volume').notNull(),
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP')
})

export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  price: real('price').notNull(),
  qty: integer('qty').notNull(),
  buyer_id: text('buyer_id').notNull(),
  seller_id: text('seller_id').notNull(),
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP')
})
```

---

## Real-time Implementation Options

### WebSocket Server (works with all databases)
```typescript
// lib/websocket-server.ts
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

export function broadcastUpdate(table: string, data: any) {
  const message = JSON.stringify({ table, data, timestamp: Date.now() })
  
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message)
    }
  })
}

// Usage in database operations
export async function insertTickWithBroadcast(tickData: any) {
  const tick = await insertTick(tickData)
  broadcastUpdate('ticks', tick)
  return tick
}
```

### Server-Sent Events (simpler alternative)
```typescript
// app/api/sse/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Send periodic updates
      const interval = setInterval(() => {
        const data = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))
      }, 30000)
      
      // Cleanup on close
      return () => clearInterval(interval)
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

## Deployment Recommendations

### Vercel + Neon (PostgreSQL)
- Best for: Production applications
- Pros: Excellent Next.js integration, managed database
- Cons: Cold starts with serverless

### Railway (Full-stack)
- Best for: Simple deployment
- Pros: Database + app hosting, persistent connections
- Cons: More expensive than serverless

### Render + MongoDB Atlas
- Best for: Cost-effective solution
- Pros: Good free tiers, reliable
- Cons: Slower than edge deployment