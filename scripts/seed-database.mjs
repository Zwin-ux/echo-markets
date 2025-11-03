#!/usr/bin/env node
// Database seeding script for Echo Markets
// Creates sample users, market data, and test orders

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX']

async function seedUsers() {
  console.log('🌱 Seeding users...')
  
  const users = [
    { email: 'demo@echomarkets.com', name: 'Demo User', cash: 10000 },
    { email: 'trader1@example.com', name: 'Alice Trader', cash: 15000 },
    { email: 'trader2@example.com', name: 'Bob Investor', cash: 8000 },
    { email: 'trader3@example.com', name: 'Carol Analyst', cash: 12000 }
  ]
  
  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
  }
  
  console.log(`✅ Created ${users.length} users`)
}

async function seedMarketData() {
  console.log('📈 Seeding market data...')
  
  const basePrice = {
    'AAPL': 150,
    'GOOGL': 2800,
    'MSFT': 300,
    'TSLA': 800,
    'AMZN': 3200,
    'NVDA': 450,
    'META': 280,
    'NFLX': 400
  }
  
  // Create initial ticks for each symbol
  for (const symbol of SYMBOLS) {
    const price = basePrice[symbol]
    const volume = Math.floor(Math.random() * 1000) + 100
    
    await prisma.tick.create({
      data: {
        symbol,
        price,
        volume,
        timestamp: new Date()
      }
    })
  }
  
  console.log(`✅ Created initial ticks for ${SYMBOLS.length} symbols`)
}

async function seedSampleOrders() {
  console.log('📋 Seeding sample orders...')
  
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('⚠️  No users found, skipping orders')
    return
  }
  
  const sampleOrders = [
    { user_id: users[0].id, symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: 10 },
    { user_id: users[0].id, symbol: 'GOOGL', side: 'BUY', type: 'LIMIT', qty: 5, limit_price: 2750 },
    { user_id: users[1].id, symbol: 'TSLA', side: 'SELL', type: 'LIMIT', qty: 20, limit_price: 820 },
    { user_id: users[2].id, symbol: 'MSFT', side: 'BUY', type: 'MARKET', qty: 15 }
  ]
  
  for (const orderData of sampleOrders) {
    await prisma.order.create({
      data: {
        ...orderData,
        status: 'OPEN'
      }
    })
  }
  
  console.log(`✅ Created ${sampleOrders.length} sample orders`)
}

async function seedSampleHoldings() {
  console.log('💼 Seeding sample holdings...')
  
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('⚠️  No users found, skipping holdings')
    return
  }
  
  const sampleHoldings = [
    { user_id: users[0].id, symbol: 'AAPL', qty: 50, avg_cost: 145 },
    { user_id: users[0].id, symbol: 'MSFT', qty: 25, avg_cost: 295 },
    { user_id: users[1].id, symbol: 'GOOGL', qty: 10, avg_cost: 2700 },
    { user_id: users[1].id, symbol: 'NVDA', qty: 30, avg_cost: 420 },
    { user_id: users[2].id, symbol: 'TSLA', qty: 15, avg_cost: 750 }
  ]
  
  for (const holdingData of sampleHoldings) {
    await prisma.holding.upsert({
      where: {
        user_id_symbol: {
          user_id: holdingData.user_id,
          symbol: holdingData.symbol
        }
      },
      update: {},
      create: holdingData
    })
  }
  
  console.log(`✅ Created ${sampleHoldings.length} sample holdings`)
}

async function seedNarratives() {
  console.log('📰 Seeding sample narratives...')
  
  const narratives = [
    { content: 'Market opens with strong tech momentum', symbol: null },
    { content: 'AAPL breaks resistance at $150', symbol: 'AAPL' },
    { content: 'Heavy volume in TSLA as earnings approach', symbol: 'TSLA' },
    { content: 'Tech sector leads morning gains', symbol: null },
    { content: 'NVDA shows continued AI optimism', symbol: 'NVDA' }
  ]
  
  for (const narrative of narratives) {
    await prisma.narrative.create({
      data: narrative
    })
  }
  
  console.log(`✅ Created ${narratives.length} sample narratives`)
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...')
    
    await seedUsers()
    await seedMarketData()
    await seedSampleOrders()
    await seedSampleHoldings()
    await seedNarratives()
    
    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()