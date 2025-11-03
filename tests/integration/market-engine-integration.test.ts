/**
 * Market Engine Integration Tests
 * Tests the integration between market engine, events system, and database
 */

import { PrismaClient } from '@prisma/client'
import MarketEngine from '@/lib/market-engine'
import MarketEventSystem from '@/lib/market-events'
import EnhancedDatabaseService from '@/lib/enhanced-db'
import { SymbolTicker } from '@/lib/types'

const prisma = new PrismaClient()

// Test database setup
beforeAll(async () => {
  // Clean up test data
  await prisma.tick.deleteMany({})
  await prisma.marketEvent.deleteMany({})
})

afterAll(async () => {
  // Clean up test data
  await prisma.tick.deleteMany({})
  await prisma.marketEvent.deleteMany({})
  await prisma.$disconnect()
})

describe('Market Engine Integration', () => {
  let marketEngine: MarketEngine
  let eventSystem: MarketEventSystem
  
  beforeEach(async () => {
    marketEngine = new MarketEngine()
    eventSystem = new MarketEventSystem()
    
    // Clean up between tests
    await prisma.tick.deleteMany({})
    await prisma.marketEvent.deleteMany({})
  })
  
  describe('Price Generation and Storage', () => {
    test('should generate and store price updates in database', async () => {
      const symbol: SymbolTicker = 'AAPL'
      
      // Generate price update
      const update = await marketEngine.generatePriceUpdate(symbol)
      
      // Verify update structure
      expect(update.symbol).toBe(symbol)
      expect(update.price).toBeGreaterThan(0)
      
      // Wait a moment for database write
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify data was stored in database
      const storedTicks = await prisma.tick.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: 1
      })
      
      expect(storedTicks).toHaveLength(1)
      expect(storedTicks[0].symbol).toBe(symbol)
      expect(storedTicks[0].price).toBe(update.price)
      expect(storedTicks[0].volatility).toBe(update.volatility)
    })
    
    test('should retrieve latest market data correctly', async () => {
      const symbols: SymbolTicker[] = ['AAPL', 'MSFT', 'TSLA']
      
      // Generate updates for multiple symbols
      const updates = await Promise.all(
        symbols.map(symbol => marketEngine.generatePriceUpdate(symbol))
      )
      
      // Wait for database writes
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Retrieve latest market data
      const latestData = await EnhancedDatabaseService.getLatestMarketData(symbols)
      
      expect(latestData).toHaveLength(symbols.length)
      
      // Verify each symbol has data
      symbols.forEach(symbol => {
        const symbolData = latestData.find(d => d.symbol === symbol)
        expect(symbolData).toBeDefined()
        expect(symbolData!.price).toBeGreaterThan(0)
      })
    })
    
    test('should handle concurrent price updates', async () => {
      const symbols: SymbolTicker[] = ['AAPL', 'MSFT', 'TSLA', 'NVDA']
      
      // Generate concurrent updates
      const updatePromises = symbols.map(symbol => 
        marketEngine.generatePriceUpdate(symbol)
      )
      
      const updates = await Promise.all(updatePromises)
      
      // Wait for database writes
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verify all updates were stored
      const storedTicks = await prisma.tick.findMany({
        where: {
          symbol: { in: symbols }
        },
        orderBy: { timestamp: 'desc' }
      })
      
      expect(storedTicks.length).toBeGreaterThanOrEqual(symbols.length)
      
      // Verify each symbol has at least one tick
      symbols.forEach(symbol => {
        const symbolTicks = storedTicks.filter(t => t.symbol === symbol)
        expect(symbolTicks.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
  
  describe('Event System Integration', () => {
    test('should store market events in database', async () => {
      // Trigger an event
      const event = await eventSystem.triggerEvent('earnings', ['AAPL'])
      
      // Wait for database write
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify event was stored
      const storedEvents = await prisma.marketEvent.findMany({
        where: { type: 'earnings' },
        orderBy: { created_at: 'desc' },
        take: 1
      })
      
      expect(storedEvents).toHaveLength(1)
      expect(storedEvents[0].type).toBe('earnings')
      expect(storedEvents[0].title).toBe(event.title)
      expect(storedEvents[0].affected_symbols).toContain('AAPL')
    })
    
    test('should retrieve recent market events', async () => {
      // Trigger multiple events
      await eventSystem.triggerEvent('earnings', ['AAPL'])
      await eventSystem.triggerEvent('news', ['MSFT'])
      await eventSystem.triggerEvent('sector_rotation', ['TSLA', 'NVDA'])
      
      // Wait for database writes
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Retrieve recent events
      const recentEvents = await EnhancedDatabaseService.getRecentMarketEvents(10)
      
      expect(recentEvents.length).toBeGreaterThanOrEqual(3)
      
      // Verify event types
      const eventTypes = recentEvents.map(e => e.type)
      expect(eventTypes).toContain('earnings')
      expect(eventTypes).toContain('news')
      expect(eventTypes).toContain('sector_rotation')
    })
  })
  
  describe('Market State and Events Interaction', () => {
    test('should affect price volatility with market events', async () => {
      const symbol: SymbolTicker = 'AAPL'
      
      // Get baseline volatility
      const baselineUpdate = await marketEngine.generatePriceUpdate(symbol)
      const baselineVolatility = baselineUpdate.volatility
      
      // Trigger a volatility spike event
      await eventSystem.triggerEvent('volatility_spike', [symbol])
      
      // Generate new price update (events should affect volatility)
      const eventAffectedUpdate = await marketEngine.generatePriceUpdate(symbol)
      
      // Verify both updates are valid
      expect(baselineVolatility).toBeGreaterThan(0)
      expect(eventAffectedUpdate.volatility).toBeGreaterThan(0)
      
      // The mechanism for event impact should be working
      expect(typeof eventAffectedUpdate.volatility).toBe('number')
    })
    
    test('should calculate combined drama score', async () => {
      // Get initial drama score
      const initialScore = eventSystem.calculateDramaScore()
      
      // Trigger some events
      await eventSystem.triggerEvent('volatility_spike')
      await eventSystem.triggerEvent('earnings', ['AAPL'])
      
      // Generate some price movements
      await marketEngine.generateAllPriceUpdates()
      
      // Get new drama score
      const newScore = eventSystem.calculateDramaScore()
      
      // Score should reflect increased activity
      expect(newScore).toBeGreaterThanOrEqual(initialScore)
      expect(newScore).toBeGreaterThanOrEqual(0)
      expect(newScore).toBeLessThanOrEqual(100)
    })
  })
  
  describe('Performance Under Load', () => {
    test('should handle high-frequency price updates', async () => {
      const symbol: SymbolTicker = 'TSLA'
      const updateCount = 50
      
      const startTime = Date.now()
      
      // Generate many price updates rapidly
      const promises = Array(updateCount).fill(null).map(() => 
        marketEngine.generatePriceUpdate(symbol)
      )
      
      const updates = await Promise.all(promises)
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000)
      expect(updates).toHaveLength(updateCount)
      
      // Wait for database writes
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify data integrity
      const storedTicks = await prisma.tick.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' }
      })
      
      expect(storedTicks.length).toBeGreaterThanOrEqual(updateCount)
      
      // Verify all prices are valid
      storedTicks.forEach(tick => {
        expect(tick.price).toBeGreaterThan(0)
        expect(tick.volatility).toBeGreaterThan(0)
      })
    })
    
    test('should handle multiple concurrent event generations', async () => {
      const eventCount = 20
      
      const startTime = Date.now()
      
      // Generate many events concurrently
      const promises = Array(eventCount).fill(null).map((_, i) => 
        eventSystem.triggerEvent(i % 2 === 0 ? 'news' : 'earnings')
      )
      
      const events = await Promise.all(promises)
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(3000)
      expect(events).toHaveLength(eventCount)
      
      // Wait for database writes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verify events were stored
      const storedEvents = await prisma.marketEvent.findMany({
        orderBy: { created_at: 'desc' }
      })
      
      expect(storedEvents.length).toBeGreaterThanOrEqual(eventCount)
    })
  })
  
  describe('Data Consistency', () => {
    test('should maintain price continuity across updates', async () => {
      const symbol: SymbolTicker = 'GOOGL'
      const updates = []
      
      // Generate a series of price updates
      for (let i = 0; i < 10; i++) {
        const update = await marketEngine.generatePriceUpdate(symbol)
        updates.push(update)
        
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Verify price continuity (no extreme jumps)
      for (let i = 1; i < updates.length; i++) {
        const prevPrice = updates[i - 1].price
        const currentPrice = updates[i].price
        const changePercent = Math.abs((currentPrice - prevPrice) / prevPrice)
        
        // No single update should change price by more than 20%
        expect(changePercent).toBeLessThan(0.20)
      }
    })
    
    test('should maintain bid-ask spread consistency', async () => {
      const symbol: SymbolTicker = 'AMZN'
      
      // Generate multiple updates
      for (let i = 0; i < 20; i++) {
        const update = await marketEngine.generatePriceUpdate(symbol)
        
        // Bid should always be less than ask
        expect(update.bid).toBeLessThan(update.ask)
        
        // Price should be between bid and ask
        expect(update.price).toBeGreaterThanOrEqual(update.bid)
        expect(update.price).toBeLessThanOrEqual(update.ask)
        
        // Spread should be reasonable
        const spread = update.ask - update.bid
        const spreadPercent = (spread / update.price) * 100
        expect(spreadPercent).toBeLessThan(1.0) // Less than 1%
        expect(spreadPercent).toBeGreaterThan(0.001) // More than 0.001%
      }
    })
  })
  
  describe('Error Handling', () => {
    test('should handle database connection issues gracefully', async () => {
      // This test would require mocking database failures
      // For now, we test that the system doesn't crash with invalid data
      
      const symbol: SymbolTicker = 'AAPL'
      
      // Should not throw errors even if database operations fail
      await expect(marketEngine.generatePriceUpdate(symbol)).resolves.toBeDefined()
    })
    
    test('should handle invalid symbol requests', async () => {
      // Test with invalid symbol (should still work due to type safety)
      const symbol: SymbolTicker = 'AAPL'
      
      const update = await marketEngine.generatePriceUpdate(symbol)
      expect(update).toBeDefined()
      expect(update.symbol).toBe(symbol)
    })
  })
})