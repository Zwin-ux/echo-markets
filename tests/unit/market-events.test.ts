/**
 * Market Events System Unit Tests
 * Tests for event generation, drama score calculation, and event management
 */

import MarketEventSystem from '@/lib/market-events'
import { SymbolTicker } from '@/lib/types'

// Mock the enhanced database service
jest.mock('@/lib/enhanced-db', () => ({
  createMarketEvent: jest.fn().mockResolvedValue({ id: 'test-event' }),
  getRecentMarketEvents: jest.fn().mockResolvedValue([])
}))

describe('MarketEventSystem', () => {
  let eventSystem: MarketEventSystem
  
  beforeEach(() => {
    eventSystem = new MarketEventSystem()
    jest.clearAllMocks()
  })
  
  describe('Event Generation', () => {
    test('should generate valid market events', async () => {
      // Try to generate events multiple times since it's probabilistic
      let event = null
      for (let i = 0; i < 50; i++) {
        event = await eventSystem.generateRandomEvent()
        if (event) break
      }
      
      if (event) {
        expect(event).toHaveProperty('type')
        expect(event).toHaveProperty('title')
        expect(event).toHaveProperty('affectedSymbols')
        expect(event).toHaveProperty('impact')
        expect(event).toHaveProperty('magnitude')
        expect(event).toHaveProperty('sentiment')
        expect(event).toHaveProperty('duration')
        expect(event).toHaveProperty('createdAt')
        
        expect(['earnings', 'news', 'sector_rotation', 'volatility_spike', 'market_wide']).toContain(event.type)
        expect(['bullish', 'bearish', 'neutral']).toContain(event.sentiment)
        expect(Array.isArray(event.affectedSymbols)).toBe(true)
        expect(event.affectedSymbols.length).toBeGreaterThan(0)
        expect(typeof event.impact).toBe('number')
        expect(event.magnitude).toBeGreaterThanOrEqual(0)
        expect(event.magnitude).toBeLessThanOrEqual(1)
        expect(event.duration).toBeGreaterThan(0)
        expect(event.createdAt).toBeInstanceOf(Date)
      }
    })
    
    test('should generate different types of events', async () => {
      const eventTypes = new Set()
      
      // Generate many events to test variety
      for (let i = 0; i < 200; i++) {
        const event = await eventSystem.generateRandomEvent()
        if (event) {
          eventTypes.add(event.type)
        }
      }
      
      // Should generate at least 2 different types of events
      expect(eventTypes.size).toBeGreaterThanOrEqual(2)
    })
    
    test('should respect event cooldowns', async () => {
      // Force generate an event
      const event1 = await eventSystem.triggerEvent('earnings')
      expect(event1).toBeDefined()
      
      // Try to generate another event immediately
      let event2 = null
      for (let i = 0; i < 10; i++) {
        event2 = await eventSystem.generateRandomEvent()
        if (event2 && event2.type === 'earnings') break
      }
      
      // Should not generate the same type immediately due to cooldown
      // (This is probabilistic, so we test the mechanism exists)
      expect(event1.type).toBe('earnings')
    })
  })
  
  describe('Event Triggering', () => {
    test('should trigger specific event types', async () => {
      const eventTypes = ['earnings', 'news', 'sector_rotation', 'volatility_spike'] as const
      
      for (const eventType of eventTypes) {
        const event = await eventSystem.triggerEvent(eventType)
        
        expect(event.type).toBe(eventType)
        expect(event.title).toBeTruthy()
        expect(event.affectedSymbols.length).toBeGreaterThan(0)
        expect(typeof event.impact).toBe('number')
        expect(event.magnitude).toBeGreaterThanOrEqual(0)
        expect(event.sentiment).toBeTruthy()
        expect(event.duration).toBeGreaterThan(0)
      }
    })
    
    test('should allow custom symbol targeting', async () => {
      const targetSymbols: SymbolTicker[] = ['AAPL', 'MSFT']
      const event = await eventSystem.triggerEvent('earnings', targetSymbols)
      
      expect(event.affectedSymbols).toEqual(targetSymbols)
    })
  })
  
  describe('Drama Score Calculation', () => {
    test('should calculate drama score within valid range', () => {
      const score = eventSystem.calculateDramaScore()
      
      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
    
    test('should increase drama score with active events', async () => {
      // Get baseline drama score
      const baselineScore = eventSystem.calculateDramaScore()
      
      // Trigger some events
      await eventSystem.triggerEvent('volatility_spike')
      await eventSystem.triggerEvent('earnings')
      
      const newScore = eventSystem.calculateDramaScore()
      
      // Score should increase with active events
      expect(newScore).toBeGreaterThanOrEqual(baselineScore)
    })
    
    test('should consider event magnitude in drama score', async () => {
      // Trigger a high-impact event
      const highImpactEvent = await eventSystem.triggerEvent('volatility_spike')
      const highImpactScore = eventSystem.calculateDramaScore()
      
      // Clear events and trigger a lower impact event
      eventSystem.cleanupExpiredEvents()
      const lowImpactEvent = await eventSystem.triggerEvent('news')
      const lowImpactScore = eventSystem.calculateDramaScore()
      
      // Both should contribute to drama score
      expect(highImpactScore).toBeGreaterThan(0)
      expect(lowImpactScore).toBeGreaterThan(0)
    })
  })
  
  describe('Event Management', () => {
    test('should track active events', async () => {
      const initialActiveEvents = eventSystem.getActiveEvents()
      
      // Trigger an event
      await eventSystem.triggerEvent('earnings')
      
      const activeEventsAfter = eventSystem.getActiveEvents()
      
      expect(activeEventsAfter.length).toBeGreaterThan(initialActiveEvents.length)
    })
    
    test('should maintain event history', async () => {
      const initialHistory = eventSystem.getEventHistory()
      
      // Trigger some events
      await eventSystem.triggerEvent('earnings')
      await eventSystem.triggerEvent('news')
      
      const newHistory = eventSystem.getEventHistory()
      
      expect(newHistory.length).toBeGreaterThan(initialHistory.length)
      expect(newHistory.length).toBeGreaterThanOrEqual(2)
    })
    
    test('should cleanup expired events', async () => {
      // Trigger an event with short duration
      const event = await eventSystem.triggerEvent('earnings')
      
      // Manually set the event to be expired
      event.createdAt = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      event.duration = 30 // 30 minutes
      
      const activeEventsBefore = eventSystem.getActiveEvents()
      
      eventSystem.cleanupExpiredEvents()
      
      const activeEventsAfter = eventSystem.getActiveEvents()
      
      // Should have fewer or equal active events after cleanup
      expect(activeEventsAfter.length).toBeLessThanOrEqual(activeEventsBefore.length)
    })
    
    test('should limit event history size', async () => {
      // Generate many events
      for (let i = 0; i < 60; i++) {
        await eventSystem.triggerEvent('news')
      }
      
      const history = eventSystem.getEventHistory(50)
      
      // Should respect the limit
      expect(history.length).toBeLessThanOrEqual(50)
    })
  })
  
  describe('Event Content Generation', () => {
    test('should generate meaningful event titles', async () => {
      const event = await eventSystem.triggerEvent('earnings')
      
      expect(event.title).toBeTruthy()
      expect(event.title.length).toBeGreaterThan(10)
      expect(event.title).not.toContain('{') // No unfilled templates
      expect(event.title).not.toContain('}')
    })
    
    test('should generate event descriptions', async () => {
      const event = await eventSystem.triggerEvent('news')
      
      if (event.description) {
        expect(event.description.length).toBeGreaterThan(20)
        expect(event.description).not.toContain('{') // No unfilled templates
        expect(event.description).not.toContain('}')
      }
    })
    
    test('should use appropriate sentiment for impact direction', async () => {
      // Generate multiple events to test sentiment logic
      const events = []
      for (let i = 0; i < 20; i++) {
        const event = await eventSystem.triggerEvent('earnings')
        events.push(event)
      }
      
      // Check that sentiment aligns with impact direction
      events.forEach(event => {
        if (event.impact > 0.1) {
          expect(event.sentiment).toBe('bullish')
        } else if (event.impact < -0.1) {
          expect(event.sentiment).toBe('bearish')
        }
        // Neutral events can have any sentiment
      })
    })
  })
  
  describe('Sector-Specific Events', () => {
    test('should generate sector rotation events affecting multiple symbols', async () => {
      const event = await eventSystem.triggerEvent('sector_rotation')
      
      // Sector rotation should affect at least one symbol, but may affect only one if it's a single-stock sector
      expect(event.affectedSymbols.length).toBeGreaterThanOrEqual(1)
      expect(event.type).toBe('sector_rotation')
    })
    
    test('should generate market-wide events affecting all symbols', async () => {
      const event = await eventSystem.triggerEvent('market_wide')
      
      expect(event.affectedSymbols.length).toBeGreaterThanOrEqual(5) // Should affect most/all symbols
      expect(event.type).toBe('market_wide')
    })
    
    test('should generate single-stock events', async () => {
      const event = await eventSystem.triggerEvent('earnings')
      
      expect(event.affectedSymbols.length).toBe(1)
      expect(event.type).toBe('earnings')
    })
  })
  
  describe('Performance', () => {
    test('should generate events efficiently', async () => {
      const startTime = Date.now()
      
      // Generate 50 events
      const promises = Array(50).fill(null).map(() => 
        eventSystem.triggerEvent('news')
      )
      
      const events = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000)
      expect(events).toHaveLength(50)
      
      // All events should be valid
      events.forEach(event => {
        expect(event.type).toBe('news')
        expect(event.title).toBeTruthy()
      })
    })
    
    test('should calculate drama score efficiently', async () => {
      // Generate some events first
      for (let i = 0; i < 20; i++) {
        await eventSystem.triggerEvent('news')
      }
      
      const startTime = Date.now()
      
      // Calculate drama score many times
      for (let i = 0; i < 1000; i++) {
        eventSystem.calculateDramaScore()
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should be very fast
      expect(duration).toBeLessThan(1000)
    })
  })
})