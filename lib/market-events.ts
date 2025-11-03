/**
 * Market Event System
 * Generates and manages market events that affect stock prices and create narrative
 */

import EnhancedDatabaseService from './enhanced-db'
import { SymbolTicker } from './types'
import { MarketEvent } from './market-engine'

// Event templates for different types of market events
const EVENT_TEMPLATES = {
  earnings: [
    {
      title: "{company} Reports {sentiment} Earnings",
      description: "{company} announced {metric} results for the quarter, {impact} analyst expectations.",
      impactRange: [0.3, 0.8],
      duration: 30
    },
    {
      title: "{company} Guidance {direction}",
      description: "{company} {direction} guidance for next quarter, citing {reason}.",
      impactRange: [0.2, 0.6],
      duration: 45
    }
  ],
  news: [
    {
      title: "{company} Announces {announcement}",
      description: "Breaking: {company} has announced {details}, potentially {impact} the stock.",
      impactRange: [0.1, 0.5],
      duration: 60
    },
    {
      title: "Analyst {action} {company}",
      description: "Major investment firm {action} {company} stock, setting price target at {target}.",
      impactRange: [0.2, 0.4],
      duration: 120
    }
  ],
  sector_rotation: [
    {
      title: "{sector} Sector Sees {direction} Movement",
      description: "Investors are {action} {sector} stocks amid {reason}.",
      impactRange: [0.2, 0.6],
      duration: 180
    }
  ],
  volatility_spike: [
    {
      title: "Market Volatility Spikes on {reason}",
      description: "Trading volumes surge as {reason} creates uncertainty in the market.",
      impactRange: [0.4, 0.9],
      duration: 90
    }
  ],
  market_wide: [
    {
      title: "{event} Impacts Broader Market",
      description: "{event} is causing widespread {sentiment} across major indices.",
      impactRange: [0.3, 0.7],
      duration: 240
    }
  ]
} as const

// Company and sector information
const COMPANY_INFO = {
  'AAPL': { name: 'Apple Inc.', sector: 'Technology' },
  'MSFT': { name: 'Microsoft Corp.', sector: 'Technology' },
  'TSLA': { name: 'Tesla Inc.', sector: 'Electric Vehicles' },
  'NVDA': { name: 'NVIDIA Corp.', sector: 'Semiconductors' },
  'AMZN': { name: 'Amazon.com Inc.', sector: 'E-commerce' },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology' }
} as const

// Event generation parameters
const EVENT_PROBABILITIES = {
  earnings: 0.15,      // 15% chance per hour during market hours
  news: 0.25,          // 25% chance per hour
  sector_rotation: 0.08, // 8% chance per hour
  volatility_spike: 0.05, // 5% chance per hour
  market_wide: 0.03    // 3% chance per hour
} as const

export class MarketEventSystem {
  private eventHistory: MarketEvent[] = []
  private lastEventTime: Map<string, Date> = new Map()
  
  /**
   * Generate a random market event
   */
  async generateRandomEvent(): Promise<MarketEvent | null> {
    const eventType = this.selectEventType()
    if (!eventType) return null
    
    // Check cooldown to prevent event spam
    const lastEvent = this.lastEventTime.get(eventType)
    if (lastEvent && Date.now() - lastEvent.getTime() < 300000) { // 5 minute cooldown
      return null
    }
    
    const event = await this.createEvent(eventType)
    if (event) {
      this.lastEventTime.set(eventType, new Date())
      this.eventHistory.push(event)
      
      // Store in database
      await this.storeEvent(event)
    }
    
    return event
  }
  
  /**
   * Select event type based on probabilities
   */
  private selectEventType(): keyof typeof EVENT_PROBABILITIES | null {
    const random = Math.random()
    let cumulative = 0
    
    for (const [eventType, probability] of Object.entries(EVENT_PROBABILITIES)) {
      cumulative += probability
      if (random < cumulative) {
        return eventType as keyof typeof EVENT_PROBABILITIES
      }
    }
    
    return null
  }
  
  /**
   * Create a specific type of market event
   */
  private async createEvent(eventType: keyof typeof EVENT_TEMPLATES): Promise<MarketEvent> {
    const templates = EVENT_TEMPLATES[eventType]
    const template = templates[Math.floor(Math.random() * templates.length)]
    
    let affectedSymbols: SymbolTicker[]
    let impact: number
    let sentiment: 'bullish' | 'bearish' | 'neutral'
    
    switch (eventType) {
      case 'earnings':
      case 'news':
        affectedSymbols = [this.selectRandomSymbol()]
        impact = this.generateImpact(template.impactRange)
        sentiment = impact > 0 ? 'bullish' : 'bearish'
        break
        
      case 'sector_rotation':
        affectedSymbols = this.selectSectorSymbols()
        impact = this.generateImpact(template.impactRange)
        sentiment = impact > 0 ? 'bullish' : 'bearish'
        break
        
      case 'volatility_spike':
        affectedSymbols = Object.keys(COMPANY_INFO) as SymbolTicker[]
        impact = 0 // Volatility spikes don't have directional impact
        sentiment = 'neutral'
        break
        
      case 'market_wide':
        affectedSymbols = Object.keys(COMPANY_INFO) as SymbolTicker[]
        impact = this.generateImpact(template.impactRange)
        sentiment = impact > 0 ? 'bullish' : 'bearish'
        break
        
      default:
        affectedSymbols = [this.selectRandomSymbol()]
        impact = this.generateImpact([0.1, 0.3])
        sentiment = 'neutral'
    }
    
    const title = this.fillTemplate(template.title, eventType, affectedSymbols[0], impact)
    const description = this.fillTemplate(template.description || '', eventType, affectedSymbols[0], impact)
    
    return {
      type: eventType,
      title,
      description,
      affectedSymbols,
      impact,
      magnitude: Math.abs(impact),
      sentiment,
      duration: template.duration + Math.random() * 60, // Add some randomness to duration
      createdAt: new Date()
    }
  }
  
  /**
   * Generate impact value within specified range
   */
  private generateImpact(range: readonly [number, number]): number {
    const [min, max] = range
    const magnitude = min + Math.random() * (max - min)
    return Math.random() < 0.5 ? -magnitude : magnitude
  }
  
  /**
   * Select a random symbol
   */
  private selectRandomSymbol(): SymbolTicker {
    const symbols = Object.keys(COMPANY_INFO) as SymbolTicker[]
    return symbols[Math.floor(Math.random() * symbols.length)]
  }
  
  /**
   * Select symbols from the same sector
   */
  private selectSectorSymbols(): SymbolTicker[] {
    const sectors = {
      'Technology': ['AAPL', 'MSFT', 'GOOGL'],
      'Electric Vehicles': ['TSLA'],
      'Semiconductors': ['NVDA'],
      'E-commerce': ['AMZN']
    }
    
    const sectorNames = Object.keys(sectors)
    const selectedSector = sectorNames[Math.floor(Math.random() * sectorNames.length)]
    return sectors[selectedSector as keyof typeof sectors] as SymbolTicker[]
  }
  
  /**
   * Fill event template with dynamic content
   */
  private fillTemplate(template: string, eventType: string, symbol: SymbolTicker, impact: number): string {
    const company = COMPANY_INFO[symbol]
    const isPositive = impact > 0
    
    const replacements = {
      '{company}': company.name,
      '{sector}': company.sector,
      '{sentiment}': isPositive ? 'Strong' : 'Disappointing',
      '{direction}': isPositive ? 'Raises' : 'Lowers',
      '{action}': isPositive ? 'buying into' : 'rotating out of',
      '{impact}': isPositive ? 'boosting' : 'pressuring',
      '{metric}': this.selectRandomMetric(isPositive),
      '{announcement}': this.selectRandomAnnouncement(),
      '{reason}': this.selectRandomReason(),
      '{details}': this.selectRandomDetails(),
      '{target}': `$${(Math.random() * 100 + 100).toFixed(0)}`,
      '{event}': this.selectRandomMarketEvent()
    }
    
    let result = template
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(placeholder, 'g'), replacement)
    }
    
    return result
  }
  
  private selectRandomMetric(isPositive: boolean): string {
    const positive = ['better-than-expected', 'record-breaking', 'impressive', 'solid']
    const negative = ['below-expectations', 'disappointing', 'concerning', 'weak']
    const metrics = isPositive ? positive : negative
    return metrics[Math.floor(Math.random() * metrics.length)]
  }
  
  private selectRandomAnnouncement(): string {
    const announcements = [
      'new product launch',
      'strategic partnership',
      'major acquisition',
      'expansion plans',
      'technology breakthrough',
      'leadership change'
    ]
    return announcements[Math.floor(Math.random() * announcements.length)]
  }
  
  private selectRandomReason(): string {
    const reasons = [
      'changing market conditions',
      'regulatory developments',
      'economic uncertainty',
      'technological shifts',
      'competitive pressures',
      'supply chain concerns'
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }
  
  private selectRandomDetails(): string {
    const details = [
      'a significant strategic initiative',
      'plans to expand market presence',
      'investment in new technologies',
      'restructuring operations',
      'entering new markets',
      'strengthening competitive position'
    ]
    return details[Math.floor(Math.random() * details.length)]
  }
  
  private selectRandomMarketEvent(): string {
    const events = [
      'Federal Reserve policy announcement',
      'geopolitical tensions',
      'economic data release',
      'trade negotiations',
      'inflation concerns',
      'employment report'
    ]
    return events[Math.floor(Math.random() * events.length)]
  }
  
  /**
   * Store event in database
   */
  private async storeEvent(event: MarketEvent): Promise<void> {
    try {
      await EnhancedDatabaseService.createMarketEvent({
        type: event.type,
        title: event.title,
        description: event.description,
        affected_symbols: event.affectedSymbols,
        impact_magnitude: event.magnitude,
        sentiment: event.sentiment
      })
    } catch (error) {
      console.error('Failed to store market event:', error)
    }
  }
  
  /**
   * Get active events (events that are still affecting the market)
   */
  getActiveEvents(): MarketEvent[] {
    const now = Date.now()
    return this.eventHistory.filter(event => {
      const eventAge = now - (event.createdAt?.getTime() || 0)
      return eventAge < event.duration * 60 * 1000 // Convert minutes to milliseconds
    })
  }
  
  /**
   * Calculate drama score based on recent events and market activity
   */
  calculateDramaScore(): number {
    const activeEvents = this.getActiveEvents()
    let score = 0
    
    // Base score from number of active events
    score += activeEvents.length * 15
    
    // Add score based on event magnitude and recency
    for (const event of activeEvents) {
      const eventAge = Date.now() - (event.createdAt?.getTime() || 0)
      const ageMinutes = eventAge / (1000 * 60)
      const recencyFactor = Math.max(0, 1 - ageMinutes / event.duration)
      
      score += event.magnitude * 30 * recencyFactor
    }
    
    // Add score for high-impact events
    const highImpactEvents = activeEvents.filter(e => e.magnitude > 0.5)
    score += highImpactEvents.length * 10
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, score))
  }
  
  /**
   * Trigger a specific event (for testing or manual triggers)
   */
  async triggerEvent(eventType: keyof typeof EVENT_TEMPLATES, symbols?: SymbolTicker[]): Promise<MarketEvent> {
    const event = await this.createEvent(eventType)
    if (symbols) {
      event.affectedSymbols = symbols
    }
    
    this.eventHistory.push(event)
    await this.storeEvent(event)
    
    return event
  }
  
  /**
   * Get recent event history
   */
  getEventHistory(limit: number = 50): MarketEvent[] {
    return this.eventHistory
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit)
  }
  
  /**
   * Clear expired events from memory
   */
  cleanupExpiredEvents(): void {
    const now = Date.now()
    this.eventHistory = this.eventHistory.filter(event => {
      const eventAge = now - (event.createdAt?.getTime() || 0)
      return eventAge < event.duration * 60 * 1000 * 2 // Keep events for 2x their duration for history
    })
  }
}

// Export singleton instance
export const marketEventSystem = new MarketEventSystem()
export default MarketEventSystem