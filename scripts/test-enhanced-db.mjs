#!/usr/bin/env node

/**
 * Test script for Enhanced Database functionality
 */

import EnhancedDatabaseService from '../lib/enhanced-db.ts'
import redis from '../lib/redis.ts'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testEnhancedDatabase() {
  console.log('🧪 Testing Enhanced Database Service...')

  try {
    // Test Redis connection
    console.log('🔗 Testing Redis connection...')
    if (redis.isReady()) {
      console.log('✅ Redis is connected and ready')
    } else {
      console.log('⚠️  Redis is not connected (this is okay for testing)')
    }

    // Test market data insertion
    console.log('📊 Testing market data insertion...')
    await EnhancedDatabaseService.insertMarketTick({
      symbol: 'TEST',
      price: 100.50,
      volume: 1000,
      bid: 100.45,
      ask: 100.55,
      change_24h: 2.50,
      change_percent_24h: 2.54,
      volatility: 0.15
    })
    console.log('✅ Market tick inserted successfully')

    // Test market data retrieval
    console.log('📈 Testing market data retrieval...')
    const marketData = await EnhancedDatabaseService.getLatestMarketData(['TEST'])
    console.log(`✅ Retrieved ${marketData.length} market data entries`)

    // Test portfolio creation
    console.log('💼 Testing portfolio management...')
    const testUserId = 'test-user-' + Date.now()
    
    // Create a test user first (simplified)
    try {
      await EnhancedDatabaseService.updateUserProfile(testUserId, {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        username: `testuser${Date.now()}`
      })
      console.log('✅ Test user created')
    } catch (error) {
      console.log('⚠️  User creation skipped (may already exist)')
    }

    // Test portfolio operations
    const portfolio = await EnhancedDatabaseService.getCurrentPortfolio(testUserId)
    console.log('✅ Portfolio retrieved/created successfully')

    await EnhancedDatabaseService.updatePortfolioValue(testUserId, new Date(), 10500, 500)
    console.log('✅ Portfolio value updated successfully')

    // Test leaderboard operations
    console.log('🏆 Testing leaderboard functionality...')
    await EnhancedDatabaseService.updateLeaderboardEntry(testUserId, 'daily_returns', 10500)
    console.log('✅ Leaderboard entry updated successfully')

    const leaderboard = await EnhancedDatabaseService.getLeaderboard('daily_returns', new Date(), 10)
    console.log(`✅ Retrieved leaderboard with ${leaderboard.length} entries`)

    // Test market events
    console.log('📰 Testing market events...')
    await EnhancedDatabaseService.createMarketEvent({
      type: 'earnings',
      title: 'Test Company Earnings Beat',
      description: 'Test company reported better than expected earnings',
      affected_symbols: ['TEST'],
      impact_magnitude: 5.2,
      sentiment: 'bullish'
    })
    console.log('✅ Market event created successfully')

    const events = await EnhancedDatabaseService.getRecentMarketEvents(5)
    console.log(`✅ Retrieved ${events.length} recent market events`)

    console.log('🎉 All Enhanced Database tests passed!')

  } catch (error) {
    console.error('❌ Enhanced Database test failed:', error)
    process.exit(1)
  } finally {
    // Cleanup
    await redis.disconnect()
    process.exit(0)
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedDatabase()
}

export { testEnhancedDatabase }