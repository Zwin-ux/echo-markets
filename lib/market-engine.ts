/**
 * Dynamic Market Engine
 * Implements realistic price generation using Geometric Brownian Motion
 * with volatility modeling, sector correlations, and market events
 */

import EnhancedDatabaseService from './enhanced-db'
import redis from './redis'
import { SymbolTicker } from './types'

// Market configuration constants
const MARKET_CONFIG = {
  // Base volatility levels by symbol (annualized)
  BASE_VOLATILITY: {
    'AAPL': 0.25,
    'MSFT': 0.22,
    'TSLA': 0.45,
    'NVDA': 0.35,
    'AMZN': 0.28,
    'GOOGL': 0.24
  } as Record<SymbolTicker, number>,
  
  // Sector correlations (simplified)
  SECTOR_GROUPS: {
    'TECH': ['AAPL', 'MSFT', 'GOOGL'] as SymbolTicker[],
    'EV_AI': ['TSLA', 'NVDA'] as SymbolTicker[],
    'ECOMMERCE': ['AMZN'] as SymbolTicker[]
  },
  
  // Market parameters
  RISK_FREE_RATE: 0.05, // 5% annual risk-free rate
  MARKET_HOURS: {
    OPEN: 9.5, // 9:30 AM
    CLOSE: 16, // 4:00 PM
  },
  
  // Price bounds (circuit breakers)
  MAX_DAILY_CHANGE: 0.20, // 20% max daily change
  MIN_PRICE: 1.0,
  MAX_PRICE: 10000.0,
  
  // Bid-ask spread parameters
  BASE_SPREAD_BPS: 5, // 5 basis points base spread
  VOLATILITY_SPREAD_MULTIPLIER: 2.0
} as const

export interface PriceUpdate {
  symbol: SymbolTicker
  price: number
  bid: number
  ask: number
  change: number
  changePercent: number
  volume: number
  volatility: number
  timestamp: Date
}

export interface MarketEvent {
  id?: string
  type: 'earnings' | 'news' | 'sector_rotation' | 'volatility_spike' | 'market_wide'
  title: string
  description?: string
  affectedSymbols: SymbolTicker[]
  impact: number // -1 to 1, where 1 is very positive, -1 is very negative
  magnitude: number // 0 to 1, intensity of the impact
  sentiment: 'bullish' | 'bearish' | 'neutral'
  duration: number // minutes the event effect lasts
  createdAt?: Date
}

export interface MarketState {
  isOpen: boolean
  dramaScore: number
  volatilityRegime: 'low' | 'normal' | 'high' | 'extreme'
  marketTrend: 'bullish' | 'bearish' | 'neutral'
  activeEvents: MarketEvent[]
}

class MarketEngine {
  private priceState: Map<SymbolTicker, number> = new Map()
  private volatilityState: Map<SymbolTicker, number> = new Map()
  private lastUpdateTime: Map<SymbolTicker, Date> = new Map()
  private activeEvents: MarketEvent[] = []
  private marketState: MarketState
  
  constructor() {
    this.marketState = {
      isOpen: this.isMarketOpen(),
      dramaScore: 0,
      volatilityRegime: 'normal',
      marketTrend: 'neutral',
      activeEvents: []
    }
    
    this.initializePriceState()
  }
  
  /**
   * Initialize price state from latest market data
   */
  private async initializePriceState(): Promise<void> {
    try {
      const symbols = Object.keys(MARKET_CONFIG.BASE_VOLATILITY) as SymbolTicker[]
      const latestData = await EnhancedDatabaseService.getLatestMarketData(symbols)
      
      for (const symbol of symbols) {
        const data = latestData.find((d: any) => d.symbol === symbol)
        if (data) {
          this.priceState.set(symbol, data.price)
          this.volatilityState.set(symbol, data.volatility || MARKET_CONFIG.BASE_VOLATILITY[symbol])
          this.lastUpdateTime.set(symbol, new Date(data.timestamp))
        } else {
          // Initialize with default values if no data exists
          this.priceState.set(symbol, 100 + Math.random() * 50)
          this.volatilityState.set(symbol, MARKET_CONFIG.BASE_VOLATILITY[symbol])
          this.lastUpdateTime.set(symbol, new Date())
        }
      }
    } catch (error) {
      console.error('Failed to initialize price state:', error)
      // Fallback to default initialization
      this.initializeDefaultPrices()
    }
  }
  
  private initializeDefaultPrices(): void {
    const symbols = Object.keys(MARKET_CONFIG.BASE_VOLATILITY) as SymbolTicker[]
    const basePrices = {
      'AAPL': 175,
      'MSFT': 380,
      'TSLA': 240,
      'NVDA': 450,
      'AMZN': 145,
      'GOOGL': 140
    }
    
    for (const symbol of symbols) {
      this.priceState.set(symbol, basePrices[symbol] || 100)
      this.volatilityState.set(symbol, MARKET_CONFIG.BASE_VOLATILITY[symbol])
      this.lastUpdateTime.set(symbol, new Date())
    }
  }
  
  /**
   * Generate price update using Geometric Brownian Motion
   */
  async generatePriceUpdate(symbol: SymbolTicker): Promise<PriceUpdate> {
    const currentPrice = this.priceState.get(symbol) || 100
    const currentVolatility = this.volatilityState.get(symbol) || MARKET_CONFIG.BASE_VOLATILITY[symbol]
    const lastUpdate = this.lastUpdateTime.get(symbol) || new Date()
    
    // Calculate time delta in years (for annualized parameters)
    const now = new Date()
    const deltaTime = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    
    // Geometric Brownian Motion: dS = μSdt + σSdW
    const drift = MARKET_CONFIG.RISK_FREE_RATE * deltaTime
    const randomShock = this.generateRandomShock()
    const volatilityAdjusted = this.adjustVolatilityForEvents(symbol, currentVolatility)
    const diffusion = volatilityAdjusted * Math.sqrt(deltaTime) * randomShock
    
    // Apply sector correlation effects
    const sectorEffect = this.calculateSectorEffect(symbol)
    
    // Apply direct event impact
    const eventImpact = this.calculateEventImpact(symbol, deltaTime)
    
    // Calculate new price
    const priceMultiplier = Math.exp(drift + diffusion + sectorEffect + eventImpact)
    let newPrice = currentPrice * priceMultiplier
    
    // Apply circuit breakers
    newPrice = this.applyCircuitBreakers(symbol, currentPrice, newPrice)
    
    // Calculate bid-ask spread
    const { bid, ask } = this.calculateBidAskSpread(newPrice, volatilityAdjusted)
    
    // Calculate change metrics
    const change = newPrice - currentPrice
    const changePercent = (change / currentPrice) * 100
    
    // Generate realistic volume
    const volume = this.generateVolume(symbol, Math.abs(changePercent), volatilityAdjusted)
    
    // Update internal state
    this.priceState.set(symbol, newPrice)
    this.volatilityState.set(symbol, volatilityAdjusted)
    this.lastUpdateTime.set(symbol, now)
    
    const priceUpdate: PriceUpdate = {
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
    
    // Store in database
    await this.storePriceUpdate(priceUpdate)
    
    return priceUpdate
  }
  
  /**
   * Generate random shock using Box-Muller transform for normal distribution
   */
  private generateRandomShock(): number {
    // Box-Muller transform to generate normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  
  /**
   * Adjust volatility based on active market events
   */
  private adjustVolatilityForEvents(symbol: SymbolTicker, baseVolatility: number): number {
    let adjustedVolatility = baseVolatility
    
    for (const event of this.activeEvents) {
      if (event.affectedSymbols.includes(symbol)) {
        // Events increase volatility based on their magnitude
        const volatilityMultiplier = 1 + (event.magnitude * 2) // Up to 3x volatility
        adjustedVolatility *= volatilityMultiplier
      }
    }
    
    // Market-wide volatility regime adjustment
    const regimeMultiplier = {
      'low': 0.7,
      'normal': 1.0,
      'high': 1.5,
      'extreme': 2.5
    }[this.marketState.volatilityRegime]
    
    adjustedVolatility *= regimeMultiplier
    
    // Cap volatility at reasonable levels
    return Math.min(adjustedVolatility, 2.0) // Max 200% annualized volatility
  }
  
  /**
   * Calculate direct price impact from market events
   */
  private calculateEventImpact(symbol: SymbolTicker, deltaTime: number): number {
    let totalImpact = 0
    
    for (const event of this.activeEvents) {
      if (event.affectedSymbols.includes(symbol)) {
        // Calculate impact decay based on event age
        const eventAge = Date.now() - (event.createdAt?.getTime() || 0)
        const ageMinutes = eventAge / (1000 * 60)
        const decayFactor = Math.max(0, 1 - ageMinutes / event.duration)
        
        // Apply impact with decay
        const impactMagnitude = event.impact * decayFactor * deltaTime * 365 // Annualized impact
        totalImpact += impactMagnitude
      }
    }
    
    // Cap total impact to prevent extreme moves
    return Math.max(-0.1, Math.min(0.1, totalImpact)) // Max ±10% impact per update
  }
  
  /**
   * Calculate sector correlation effects
   */
  private calculateSectorEffect(symbol: SymbolTicker): number {
    let sectorEffect = 0
    
    // Find which sector this symbol belongs to
    for (const [sector, symbols] of Object.entries(MARKET_CONFIG.SECTOR_GROUPS)) {
      if (symbols.includes(symbol)) {
        // Calculate average movement of other symbols in the sector
        const otherSymbols = symbols.filter(s => s !== symbol)
        let sectorMovement = 0
        let count = 0
        
        for (const otherSymbol of otherSymbols) {
          const currentPrice = this.priceState.get(otherSymbol)
          const lastUpdate = this.lastUpdateTime.get(otherSymbol)
          
          if (currentPrice && lastUpdate) {
            // Simple correlation effect (in practice, this would be more sophisticated)
            const timeSinceUpdate = Date.now() - lastUpdate.getTime()
            if (timeSinceUpdate < 60000) { // Only consider recent updates (1 minute)
              // This is a simplified correlation - in reality you'd track price changes
              sectorMovement += (Math.random() - 0.5) * 0.01 // Small correlation effect
              count++
            }
          }
        }
        
        if (count > 0) {
          sectorEffect = (sectorMovement / count) * 0.3 // 30% correlation strength
        }
        break
      }
    }
    
    return sectorEffect
  }
  
  /**
   * Apply circuit breakers to prevent unrealistic price movements
   */
  private applyCircuitBreakers(symbol: SymbolTicker, oldPrice: number, newPrice: number): number {
    // Daily change limit
    const dailyChangePercent = Math.abs((newPrice - oldPrice) / oldPrice)
    if (dailyChangePercent > MARKET_CONFIG.MAX_DAILY_CHANGE) {
      const direction = newPrice > oldPrice ? 1 : -1
      newPrice = oldPrice * (1 + direction * MARKET_CONFIG.MAX_DAILY_CHANGE)
    }
    
    // Absolute price bounds
    newPrice = Math.max(MARKET_CONFIG.MIN_PRICE, Math.min(MARKET_CONFIG.MAX_PRICE, newPrice))
    
    return newPrice
  }
  
  /**
   * Calculate realistic bid-ask spread
   */
  private calculateBidAskSpread(price: number, volatility: number): { bid: number; ask: number } {
    // Base spread in basis points
    let spreadBps = MARKET_CONFIG.BASE_SPREAD_BPS
    
    // Adjust spread based on volatility
    spreadBps *= (1 + volatility * MARKET_CONFIG.VOLATILITY_SPREAD_MULTIPLIER)
    
    // Adjust spread based on market conditions
    if (!this.marketState.isOpen) {
      spreadBps *= 2 // Wider spreads when market is closed
    }
    
    const spreadAmount = price * (spreadBps / 10000) // Convert basis points to decimal
    const halfSpread = spreadAmount / 2
    
    return {
      bid: price - halfSpread,
      ask: price + halfSpread
    }
  }
  
  /**
   * Generate realistic trading volume
   */
  private generateVolume(symbol: SymbolTicker, changePercent: number, volatility: number): number {
    // Base volume varies by symbol (simplified)
    const baseVolume = {
      'AAPL': 50000000,
      'MSFT': 30000000,
      'TSLA': 80000000,
      'NVDA': 40000000,
      'AMZN': 35000000,
      'GOOGL': 25000000
    }[symbol] || 20000000
    
    // Volume increases with price movement and volatility
    const volumeMultiplier = 1 + (changePercent / 100) * 2 + volatility
    const randomFactor = 0.5 + Math.random() // 0.5 to 1.5 random multiplier
    
    return Math.round(baseVolume * volumeMultiplier * randomFactor * 0.1) // Scale down for simulation
  }
  
  /**
   * Store price update in database
   */
  private async storePriceUpdate(update: PriceUpdate): Promise<void> {
    try {
      await EnhancedDatabaseService.insertMarketTick({
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
      console.error(`Failed to store price update for ${update.symbol}:`, error)
    }
  }
  
  /**
   * Check if market is currently open
   */
  private isMarketOpen(): boolean {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const day = now.getDay()
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false
    
    // Market hours: 9:30 AM to 4:00 PM ET
    return hour >= MARKET_CONFIG.MARKET_HOURS.OPEN && hour < MARKET_CONFIG.MARKET_HOURS.CLOSE
  }
  
  /**
   * Update market state and sync with market event system
   */
  updateMarketState(): void {
    this.marketState.isOpen = this.isMarketOpen()
    
    // Sync active events from market event system
    this.syncActiveEvents()
    
    // Filter out expired events
    this.marketState.activeEvents = this.activeEvents.filter(event => {
      const eventAge = Date.now() - (event.createdAt?.getTime() || 0)
      return eventAge < event.duration * 60 * 1000 // Convert minutes to milliseconds
    })
    
    // Update drama score based on recent volatility and events
    this.updateDramaScore()
    
    // Update volatility regime
    this.updateVolatilityRegime()
  }
  
  /**
   * Sync active events from the market event system
   */
  private async syncActiveEvents(): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { marketEventSystem } = await import('./market-events')
      this.activeEvents = marketEventSystem.getActiveEvents()
    } catch (error) {
      console.error('Failed to sync market events:', error)
    }
  }
  
  /**
   * Calculate drama score based on market activity
   */
  private updateDramaScore(): void {
    let score = 0
    
    // Base score from volatility
    const avgVolatility = Array.from(this.volatilityState.values()).reduce((a, b) => a + b, 0) / this.volatilityState.size
    score += avgVolatility * 50
    
    // Add score from active events
    score += this.activeEvents.length * 10
    score += this.activeEvents.reduce((sum, event) => sum + event.magnitude * 20, 0)
    
    // Normalize to 0-100 scale
    this.marketState.dramaScore = Math.min(100, Math.max(0, score))
  }
  
  /**
   * Update volatility regime based on recent market activity
   */
  private updateVolatilityRegime(): void {
    const avgVolatility = Array.from(this.volatilityState.values()).reduce((a, b) => a + b, 0) / this.volatilityState.size
    
    if (avgVolatility < 0.15) {
      this.marketState.volatilityRegime = 'low'
    } else if (avgVolatility < 0.30) {
      this.marketState.volatilityRegime = 'normal'
    } else if (avgVolatility < 0.60) {
      this.marketState.volatilityRegime = 'high'
    } else {
      this.marketState.volatilityRegime = 'extreme'
    }
  }
  
  /**
   * Get current market state
   */
  getMarketState(): MarketState {
    return { ...this.marketState }
  }
  
  /**
   * Generate price updates for all symbols
   */
  async generateAllPriceUpdates(): Promise<PriceUpdate[]> {
    const symbols = Object.keys(MARKET_CONFIG.BASE_VOLATILITY) as SymbolTicker[]
    const updates: PriceUpdate[] = []
    
    for (const symbol of symbols) {
      try {
        const update = await this.generatePriceUpdate(symbol)
        updates.push(update)
      } catch (error) {
        console.error(`Failed to generate price update for ${symbol}:`, error)
      }
    }
    
    // Update market state after generating all prices
    this.updateMarketState()
    
    return updates
  }
}

// Export singleton instance
export const marketEngine = new MarketEngine()
export default MarketEngine