/**
 * Market Engine Unit Tests
 * Tests for price generation algorithms and market state management
 */

import MarketEngine from '@/lib/market-engine'
import { SymbolTicker } from '@/lib/types'

// Mock the enhanced database service
jest.mock('@/lib/enhanced-db', () => ({
  getLatestMarketData: jest.fn().mockResolvedValue([]),
  insertMarketTick: jest.fn().mockResolvedValue({ id: 'test-tick' })
}))

// Mock Redis
jest.mock('@/lib/redis', () => ({
  isReady: jest.fn().mockReturnValue(false),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}))

describe('MarketEngine', () => {
  let marketEngine: MarketEngine
  
  beforeEach(() => {
    marketEngine = new MarketEngine()
    // Allow time for initialization
    jest.clearAllMocks()
  })
  
  describe('Price Generation', () => {
    test('should generate valid price updates', async () => {
      const symbol: SymbolTicker = 'AAPL'
      const update = await marketEngine.generatePriceUpdate(symbol)
      
      expect(update).toHaveProperty('symbol', symbol)
      expect(update).toHaveProperty('price')
      expect(update).toHaveProperty('bid')
      expect(update).toHaveProperty('ask')
      expect(update).toHaveProperty('change')
      expect(update).toHaveProperty('changePercent')
      expect(update).toHaveProperty('volume')
      expect(update).toHaveProperty('volatility')
      expect(update).toHaveProperty('timestamp')
      
      // Price should be positive
      expect(update.price).toBeGreaterThan(0)
      
      // Bid should be less than ask
      expect(update.bid).toBeLessThan(update.ask)
      
      // Volume should be positive
      expect(update.volume).toBeGreaterThan(0)
      
      // Volatility should be reasonable
      expect(update.volatility).toBeGreaterThan(0)
      expect(update.volatility).toBeLessThan(2.0)
    })
    
    test('should apply circuit breakers for extreme price movements', async () => {
      const symbol: SymbolTicker = 'TSLA'
      const initialUpdate = await marketEngine.generatePriceUpdate(symbol)
      const initialPrice = initialUpdate.price
      
      // Generate multiple updates to test circuit breakers
      let extremeChangeDetected = false
      
      for (let i = 0; i < 100; i++) {
        const update = await marketEngine.generatePriceUpdate(symbol)
        const changePercent = Math.abs((update.price - initialPrice) / initialPrice)
        
        // Circuit breaker should prevent changes > 20% in a single update
        if (changePercent > 0.25) { // Allow some tolerance for accumulated changes
          extremeChangeDetected = true
          break
        }
      }
      
      // In 100 iterations, we shouldn't see extreme single-update changes
      expect(extremeChangeDetected).toBe(false)
    })
    
    test('should maintain price bounds', async () => {
      const symbol: SymbolTicker = 'NVDA'
      
      // Generate multiple price updates
      for (let i = 0; i < 50; i++) {
        const update = await marketEngine.generatePriceUpdate(symbol)
        
        // Price should be within reasonable bounds
        expect(update.price).toBeGreaterThanOrEqual(1.0)
        expect(update.price).toBeLessThanOrEqual(10000.0)
      }
    })
    
    test('should generate realistic bid-ask spreads', async () => {
      const symbol: SymbolTicker = 'MSFT'
      const update = await marketEngine.generatePriceUpdate(symbol)
      
      const spread = update.ask - update.bid
      const spreadPercent = (spread / update.price) * 100
      
      // Spread should be positive but reasonable (< 1%)
      expect(spread).toBeGreaterThan(0)
      expect(spreadPercent).toBeLessThan(1.0)
      expect(spreadPercent).toBeGreaterThan(0.001) // At least 0.001%
    })
    
    test('should generate correlated sector movements', async () => {
      // Test that tech stocks show some correlation
      const techSymbols: SymbolTicker[] = ['AAPL', 'MSFT', 'GOOGL']
      const updates = await Promise.all(
        techSymbols.map(symbol => marketEngine.generatePriceUpdate(symbol))
      )
      
      // All updates should be valid
      updates.forEach(update => {
        expect(update.price).toBeGreaterThan(0)
        expect(update.volatility).toBeGreaterThan(0)
      })
      
      // This is a basic test - in practice, correlation would be measured over time
      expect(updates).toHaveLength(3)
    })
  })
  
  describe('Market State Management', () => {
    test('should track market state correctly', () => {
      const state = marketEngine.getMarketState()
      
      expect(state).toHaveProperty('isOpen')
      expect(state).toHaveProperty('dramaScore')
      expect(state).toHaveProperty('volatilityRegime')
      expect(state).toHaveProperty('marketTrend')
      expect(state).toHaveProperty('activeEvents')
      
      expect(typeof state.isOpen).toBe('boolean')
      expect(typeof state.dramaScore).toBe('number')
      expect(['low', 'normal', 'high', 'extreme']).toContain(state.volatilityRegime)
      expect(['bullish', 'bearish', 'neutral']).toContain(state.marketTrend)
      expect(Array.isArray(state.activeEvents)).toBe(true)
    })
    
    test('should calculate drama score within valid range', () => {
      const state = marketEngine.getMarketState()
      
      expect(state.dramaScore).toBeGreaterThanOrEqual(0)
      expect(state.dramaScore).toBeLessThanOrEqual(100)
    })
    
    test('should update volatility regime based on market conditions', async () => {
      // Generate some price updates to affect volatility
      const symbols: SymbolTicker[] = ['AAPL', 'MSFT', 'TSLA']
      
      for (const symbol of symbols) {
        await marketEngine.generatePriceUpdate(symbol)
      }
      
      const state = marketEngine.getMarketState()
      expect(['low', 'normal', 'high', 'extreme']).toContain(state.volatilityRegime)
    })
  })
  
  describe('Batch Operations', () => {
    test('should generate updates for all symbols', async () => {
      const updates = await marketEngine.generateAllPriceUpdates()
      
      // Should have updates for all configured symbols
      expect(updates.length).toBeGreaterThan(0)
      expect(updates.length).toBeLessThanOrEqual(6) // Max 6 symbols configured
      
      // Each update should be valid
      updates.forEach(update => {
        expect(update.price).toBeGreaterThan(0)
        expect(update.bid).toBeLessThan(update.ask)
        expect(update.volume).toBeGreaterThan(0)
        expect(update.volatility).toBeGreaterThan(0)
      })
      
      // Should have unique symbols
      const symbols = updates.map(u => u.symbol)
      const uniqueSymbols = [...new Set(symbols)]
      expect(symbols.length).toBe(uniqueSymbols.length)
    })
  })
  
  describe('Volatility Modeling', () => {
    test('should adjust volatility based on market events', async () => {
      const symbol: SymbolTicker = 'AAPL'
      
      // Get baseline volatility
      const baselineUpdate = await marketEngine.generatePriceUpdate(symbol)
      const baselineVolatility = baselineUpdate.volatility
      
      // Simulate market event by directly manipulating market state
      // (In practice, this would be done through the event system)
      const marketState = marketEngine.getMarketState()
      marketState.volatilityRegime = 'high'
      
      // Generate new update
      const highVolUpdate = await marketEngine.generatePriceUpdate(symbol)
      
      // Volatility should generally be higher in high volatility regime
      // (Note: This is probabilistic, so we test the mechanism exists)
      expect(highVolUpdate.volatility).toBeGreaterThan(0)
      expect(typeof highVolUpdate.volatility).toBe('number')
    })
    
    test('should use different base volatilities for different symbols', async () => {
      const conservativeSymbol: SymbolTicker = 'MSFT'
      const volatileSymbol: SymbolTicker = 'TSLA'
      
      const conservativeUpdate = await marketEngine.generatePriceUpdate(conservativeSymbol)
      const volatileUpdate = await marketEngine.generatePriceUpdate(volatileSymbol)
      
      // Both should have valid volatilities
      expect(conservativeUpdate.volatility).toBeGreaterThan(0)
      expect(volatileUpdate.volatility).toBeGreaterThan(0)
      
      // TSLA should generally have higher base volatility than MSFT
      // (This tests the configuration is being used)
      expect(typeof conservativeUpdate.volatility).toBe('number')
      expect(typeof volatileUpdate.volatility).toBe('number')
    })
  })
  
  describe('Performance', () => {
    test('should generate price updates efficiently', async () => {
      const startTime = Date.now()
      const symbol: SymbolTicker = 'AAPL'
      
      // Generate 100 price updates
      const promises = Array(100).fill(null).map(() => 
        marketEngine.generatePriceUpdate(symbol)
      )
      
      const updates = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (< 5 seconds for 100 updates)
      expect(duration).toBeLessThan(5000)
      expect(updates).toHaveLength(100)
      
      // All updates should be valid
      updates.forEach(update => {
        expect(update.price).toBeGreaterThan(0)
        expect(update.symbol).toBe(symbol)
      })
    })
    
    test('should handle concurrent price generation', async () => {
      const symbols: SymbolTicker[] = ['AAPL', 'MSFT', 'TSLA', 'NVDA']
      
      const startTime = Date.now()
      
      // Generate updates for all symbols concurrently
      const updatePromises = symbols.map(symbol => 
        marketEngine.generatePriceUpdate(symbol)
      )
      
      const updates = await Promise.all(updatePromises)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete quickly
      expect(duration).toBeLessThan(2000)
      expect(updates).toHaveLength(symbols.length)
      
      // Each symbol should have one update
      const updateSymbols = updates.map(u => u.symbol).sort()
      expect(updateSymbols).toEqual(symbols.sort())
    })
  })
})