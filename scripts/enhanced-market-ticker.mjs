/**
 * Enhanced Market Ticker
 * Uses the new Dynamic Market Engine with Geometric Brownian Motion
 * and market events for realistic price simulation
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

// Import market engine (we'll need to adapt this for ES modules)
class EnhancedMarketTicker {
  constructor() {
    this.isRunning = false
    this.intervalId = null
    this.eventIntervalId = null
    
    // Market state
    this.priceState = new Map()
    this.volatilityState = new Map()
    this.lastUpdateTime = new Map()
    this.activeEvents = []
    
    // Configuration
    this.config = {
      BASE_VOLATILITY: {
        'AAPL': 0.25,
        'MSFT': 0.22,
        'TSLA': 0.45,
        'NVDA': 0.35,
        'AMZN': 0.28,
        'GOOGL': 0.24
      },
      RISK_FREE_RATE: 0.05,
      BASE_SPREAD_BPS: 5,
      VOLATILITY_SPREAD_MULTIPLIER: 2.0,
      UPDATE_INTERVAL: 2000, // 2 seconds
      EVENT_CHECK_INTERVAL: 60000 // 1 minute
    }
    
    this.initializePrices()
  }
  
  initializePrices() {
    const basePrices = {
      'AAPL': 175,
      'MSFT': 380,
      'TSLA': 240,
      'NVDA': 450,
      'AMZN': 145,
      'GOOGL': 140
    }
    
    for (const [symbol, price] of Object.entries(basePrices)) {
      this.priceState.set(symbol, price)
      this.volatilityState.set(symbol, this.config.BASE_VOLATILITY[symbol])
      this.lastUpdateTime.set(symbol, new Date())
    }
  }
  
  generateRandomShock() {
    // Box-Muller transform for normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  
  calculateBidAskSpread(price, volatility) {
    let spreadBps = this.config.BASE_SPREAD_BPS
    spreadBps *= (1 + volatility * this.config.VOLATILITY_SPREAD_MULTIPLIER)
    
    const spreadAmount = price * (spreadBps / 10000)
    const halfSpread = spreadAmount / 2
    
    return {
      bid: price - halfSpread,
      ask: price + halfSpread
    }
  }
  
  generateVolume(symbol, changePercent, volatility) {
    const baseVolume = {
      'AAPL': 50000000,
      'MSFT': 30000000,
      'TSLA': 80000000,
      'NVDA': 40000000,
      'AMZN': 35000000,
      'GOOGL': 25000000
    }[symbol] || 20000000
    
    const volumeMultiplier = 1 + (changePercent / 100) * 2 + volatility
    const randomFactor = 0.5 + Math.random()
    
    return Math.round(baseVolume * volumeMultiplier * randomFactor * 0.1)
  }
  
  adjustVolatilityForEvents(symbol, baseVolatility) {
    let adjustedVolatility = baseVolatility
    
    for (const event of this.activeEvents) {
      if (event.affectedSymbols.includes(symbol)) {
        const volatilityMultiplier = 1 + (event.magnitude * 2)
        adjustedVolatility *= volatilityMultiplier
      }
    }
    
    return Math.min(adjustedVolatility, 2.0)
  }
  
  generatePriceUpdate(symbol) {
    const currentPrice = this.priceState.get(symbol)
    const currentVolatility = this.volatilityState.get(symbol)
    const lastUpdate = this.lastUpdateTime.get(symbol)
    
    // Calculate time delta in years
    const now = new Date()
    const deltaTime = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    
    // Geometric Brownian Motion
    const drift = this.config.RISK_FREE_RATE * deltaTime
    const randomShock = this.generateRandomShock()
    const volatilityAdjusted = this.adjustVolatilityForEvents(symbol, currentVolatility)
    const diffusion = volatilityAdjusted * Math.sqrt(deltaTime) * randomShock
    
    // Calculate new price
    const priceMultiplier = Math.exp(drift + diffusion)
    let newPrice = currentPrice * priceMultiplier
    
    // Apply circuit breakers
    const maxDailyChange = 0.20
    const dailyChangePercent = Math.abs((newPrice - currentPrice) / currentPrice)
    if (dailyChangePercent > maxDailyChange) {
      const direction = newPrice > currentPrice ? 1 : -1
      newPrice = currentPrice * (1 + direction * maxDailyChange)
    }
    
    // Price bounds
    newPrice = Math.max(1.0, Math.min(10000.0, newPrice))
    
    // Calculate metrics
    const change = newPrice - currentPrice
    const changePercent = (change / currentPrice) * 100
    const { bid, ask } = this.calculateBidAskSpread(newPrice, volatilityAdjusted)
    const volume = this.generateVolume(symbol, Math.abs(changePercent), volatilityAdjusted)
    
    // Update state
    this.priceState.set(symbol, newPrice)
    this.volatilityState.set(symbol, volatilityAdjusted)
    this.lastUpdateTime.set(symbol, now)
    
    return {
      symbol,
      price: Math.round(newPrice * 100) / 100,
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      volatility: Math.round(volatilityAdjusted * 10000) / 10000,
      timestamp: now
    }
  }
  
  async generateMarketEvent() {
    const eventTypes = ['earnings', 'news', 'sector_rotation', 'volatility_spike']
    const probabilities = [0.15, 0.25, 0.08, 0.05]
    
    const random = Math.random()
    let cumulative = 0
    let selectedType = null
    
    for (let i = 0; i < eventTypes.length; i++) {
      cumulative += probabilities[i]
      if (random < cumulative) {
        selectedType = eventTypes[i]
        break
      }
    }
    
    if (!selectedType) return null
    
    // Simple event generation
    const symbols = Object.keys(this.config.BASE_VOLATILITY)
    const affectedSymbols = selectedType === 'volatility_spike' || selectedType === 'sector_rotation' 
      ? symbols 
      : [symbols[Math.floor(Math.random() * symbols.length)]]
    
    const magnitude = 0.2 + Math.random() * 0.6
    const impact = Math.random() < 0.5 ? -magnitude : magnitude
    
    const event = {
      type: selectedType,
      title: `Market Event: ${selectedType}`,
      affectedSymbols,
      impact,
      magnitude,
      sentiment: impact > 0 ? 'bullish' : 'bearish',
      duration: 30 + Math.random() * 90, // 30-120 minutes
      createdAt: new Date()
    }
    
    this.activeEvents.push(event)
    
    // Store in database
    try {
      await prisma.marketEvent.create({
        data: {
          type: event.type,
          title: event.title,
          description: `Generated market event affecting ${affectedSymbols.join(', ')}`,
          affected_symbols: affectedSymbols,
          impact_magnitude: magnitude,
          sentiment: event.sentiment
        }
      })
      
      console.log(`[market-ticker] Generated ${selectedType} event affecting ${affectedSymbols.join(', ')}`)
    } catch (error) {
      console.error('[market-ticker] Failed to store event:', error.message)
    }
    
    return event
  }
  
  cleanupExpiredEvents() {
    const now = Date.now()
    this.activeEvents = this.activeEvents.filter(event => {
      const eventAge = now - event.createdAt.getTime()
      return eventAge < event.duration * 60 * 1000
    })
  }
  
  async updatePrices() {
    const symbols = Object.keys(this.config.BASE_VOLATILITY)
    const updates = []
    
    for (const symbol of symbols) {
      try {
        const update = this.generatePriceUpdate(symbol)
        updates.push({
          symbol: update.symbol,
          price: update.price,
          volume: update.volume,
          bid: update.bid,
          ask: update.ask,
          change_24h: update.change,
          change_percent_24h: update.changePercent,
          volatility: update.volatility
        })
      } catch (error) {
        console.error(`[market-ticker] Failed to generate update for ${symbol}:`, error.message)
      }
    }
    
    if (updates.length > 0) {
      try {
        await prisma.tick.createMany({
          data: updates
        })
        
        const avgChange = updates.reduce((sum, u) => sum + Math.abs(u.change_percent_24h), 0) / updates.length
        console.log(`[market-ticker] Updated ${updates.length} prices, avg change: ${avgChange.toFixed(2)}%`)
      } catch (error) {
        console.error('[market-ticker] Failed to store price updates:', error.message)
      }
    }
  }
  
  async checkForEvents() {
    try {
      // Clean up expired events
      this.cleanupExpiredEvents()
      
      // Maybe generate a new event
      await this.generateMarketEvent()
      
      console.log(`[market-ticker] Active events: ${this.activeEvents.length}`)
    } catch (error) {
      console.error('[market-ticker] Event check failed:', error.message)
    }
  }
  
  start() {
    if (this.isRunning) {
      console.log('[market-ticker] Already running')
      return
    }
    
    console.log('[market-ticker] Starting enhanced market ticker...')
    this.isRunning = true
    
    // Start price updates
    this.intervalId = setInterval(() => {
      this.updatePrices()
    }, this.config.UPDATE_INTERVAL)
    
    // Start event generation
    this.eventIntervalId = setInterval(() => {
      this.checkForEvents()
    }, this.config.EVENT_CHECK_INTERVAL)
    
    // Initial update
    this.updatePrices()
  }
  
  stop() {
    if (!this.isRunning) {
      console.log('[market-ticker] Not running')
      return
    }
    
    console.log('[market-ticker] Stopping enhanced market ticker...')
    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    if (this.eventIntervalId) {
      clearInterval(this.eventIntervalId)
      this.eventIntervalId = null
    }
  }
}

// Create and start the ticker
const ticker = new EnhancedMarketTicker()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[market-ticker] Received SIGINT, shutting down gracefully...')
  ticker.stop()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n[market-ticker] Received SIGTERM, shutting down gracefully...')
  ticker.stop()
  await prisma.$disconnect()
  process.exit(0)
})

// Start the ticker
ticker.start()

console.log('[market-ticker] Enhanced market ticker started. Press Ctrl+C to stop.')