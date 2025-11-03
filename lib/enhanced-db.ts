/**
 * Enhanced Database Service
 * Integrates Prisma with Redis caching for optimal performance
 */

import prisma, { DatabasePerformanceOptimizer } from './db-pool'
import redis from './redis'
import { Prisma } from '@prisma/client'

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  USER_PROFILE: 300,      // 5 minutes
  PORTFOLIO: 60,          // 1 minute
  MARKET_DATA: 30,        // 30 seconds
  LEADERBOARD: 120,       // 2 minutes
  QUEST_PROGRESS: 180,    // 3 minutes
  MARKET_EVENTS: 600,     // 10 minutes
} as const

export class EnhancedDatabaseService {
  // User Management
  static async getUserById(userId: string) {
    const cacheKey = `user:${userId}`
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    // Fallback to database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          orderBy: { session_date: 'desc' },
          take: 1
        },
        quests: {
          where: { status: 'ACTIVE' },
          orderBy: { created_at: 'desc' }
        }
      }
    })
    
    // Cache the result
    if (user && redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(user), CACHE_TTL.USER_PROFILE)
    }
    
    return user
  }

  static async updateUserProfile(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    })
    
    // Invalidate cache
    if (redis.isReady()) {
      await redis.del(`user:${userId}`)
    }
    
    return user
  }

  // Portfolio Management
  static async getCurrentPortfolio(userId: string, sessionDate?: Date) {
    const date = sessionDate || new Date()
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `portfolio:${userId}:${dateStr}`
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    // Get or create portfolio for the session
    let portfolio = await prisma.portfolio.findUnique({
      where: {
        user_id_session_date: {
          user_id: userId,
          session_date: date
        }
      }
    })
    
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          user_id: userId,
          session_date: date,
          starting_cash: 10000,
          current_cash: 10000,
          total_value: 10000
        }
      })
    }
    
    // Cache the result
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(portfolio), CACHE_TTL.PORTFOLIO)
    }
    
    return portfolio
  }

  static async updatePortfolioValue(userId: string, sessionDate: Date, totalValue: number, dayChange: number) {
    const portfolio = await prisma.portfolio.update({
      where: {
        user_id_session_date: {
          user_id: userId,
          session_date: sessionDate
        }
      },
      data: {
        total_value: totalValue,
        day_change: dayChange,
        day_change_percent: dayChange / (totalValue - dayChange) * 100,
        updated_at: new Date()
      }
    })
    
    // Invalidate cache
    const dateStr = sessionDate.toISOString().split('T')[0]
    if (redis.isReady()) {
      await redis.del(`portfolio:${userId}:${dateStr}`)
    }
    
    return portfolio
  }

  // Market Data Management
  static async getLatestMarketData(symbols?: string[]) {
    const cacheKey = symbols ? `market:${symbols.join(',')}` : 'market:all'
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    const where = symbols ? { symbol: { in: symbols } } : {}
    
    // Get latest tick for each symbol
    const latestTicks = await prisma.tick.groupBy({
      by: ['symbol'],
      where,
      _max: {
        timestamp: true
      }
    })
    
    const marketData = await Promise.all(
      latestTicks.map(async (group: any) => {
        return await prisma.tick.findFirst({
          where: {
            symbol: group.symbol,
            timestamp: group._max.timestamp!
          }
        })
      })
    )
    
    const result = marketData.filter(Boolean)
    
    // Cache the result
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL.MARKET_DATA)
    }
    
    return result
  }

  static async insertMarketTick(data: {
    symbol: string
    price: number
    volume?: number
    bid?: number
    ask?: number
    change_24h?: number
    change_percent_24h?: number
    volatility?: number
  }) {
    const tick = await prisma.tick.create({
      data: {
        symbol: data.symbol,
        price: data.price,
        volume: data.volume || 0,
        bid: data.bid,
        ask: data.ask,
        change_24h: data.change_24h,
        change_percent_24h: data.change_percent_24h,
        volatility: data.volatility
      }
    })
    
    // Invalidate market data cache
    if (redis.isReady()) {
      await redis.del(`market:${data.symbol}`)
      await redis.del('market:all')
    }
    
    return tick
  }

  // Leaderboard Management
  static async getLeaderboard(category: string, sessionDate?: Date, limit: number = 50) {
    const date = sessionDate || new Date()
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `leaderboard:${category}:${dateStr}:${limit}`
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        category,
        session_date: date
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { created_at: 'asc' }
      ],
      take: limit
    })
    
    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1
    }))
    
    // Cache the result
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(rankedLeaderboard), CACHE_TTL.LEADERBOARD)
    }
    
    return rankedLeaderboard
  }

  static async updateLeaderboardEntry(userId: string, category: string, score: number, sessionDate?: Date) {
    const date = sessionDate || new Date()
    
    const entry = await prisma.leaderboardEntry.upsert({
      where: {
        user_id_session_date_category: {
          user_id: userId,
          session_date: date,
          category
        }
      },
      update: {
        score,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        session_date: date,
        category,
        score
      }
    })
    
    // Invalidate leaderboard cache
    const dateStr = date.toISOString().split('T')[0]
    if (redis.isReady()) {
      await redis.del(`leaderboard:${category}:${dateStr}:*`)
    }
    
    return entry
  }

  // Quest Management
  static async getUserActiveQuests(userId: string) {
    const cacheKey = `quests:${userId}`
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    const quests = await prisma.quest.findMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      },
      orderBy: { created_at: 'desc' }
    })
    
    // Cache the result
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(quests), CACHE_TTL.QUEST_PROGRESS)
    }
    
    return quests
  }

  static async updateQuestProgress(questId: string, progress: number) {
    // First get the quest to check target value
    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId }
    })
    
    if (!existingQuest) {
      throw new Error('Quest not found')
    }
    
    const quest = await prisma.quest.update({
      where: { id: questId },
      data: {
        current_progress: progress,
        status: progress >= (existingQuest.target_value || 0) ? 'COMPLETED' : 'ACTIVE'
      }
    })
    
    // Invalidate user quests cache
    if (redis.isReady()) {
      await redis.del(`quests:${quest.user_id}`)
    }
    
    return quest
  }

  // Market Events Management
  static async getRecentMarketEvents(limit: number = 20) {
    const cacheKey = `market_events:recent:${limit}`
    
    // Try Redis cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
    
    const events = await prisma.marketEvent.findMany({
      orderBy: { created_at: 'desc' },
      take: limit
    })
    
    // Cache the result
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(events), CACHE_TTL.MARKET_EVENTS)
    }
    
    return events
  }

  static async createMarketEvent(data: {
    type: string
    title: string
    description?: string
    affected_symbols: string[]
    impact_magnitude?: number
    sentiment?: string
  }) {
    const event = await prisma.marketEvent.create({
      data
    })
    
    // Invalidate market events cache
    if (redis.isReady()) {
      await redis.del('market_events:recent:*')
    }
    
    return event
  }

  // Batch Operations
  static async batchUpdatePortfolios(updates: Array<{
    userId: string
    sessionDate: Date
    totalValue: number
    dayChange: number
  }>) {
    return await DatabasePerformanceOptimizer.batchOperation(
      updates,
      async (batch) => {
        return await Promise.all(
          batch.map(update => 
            this.updatePortfolioValue(update.userId, update.sessionDate, update.totalValue, update.dayChange)
          )
        )
      },
      50 // Process 50 at a time
    )
  }

  // Cache Management
  static async clearUserCache(userId: string) {
    if (redis.isReady()) {
      await redis.del(`user:${userId}`)
      await redis.del(`quests:${userId}`)
      // Clear portfolio cache for current date
      const dateStr = new Date().toISOString().split('T')[0]
      await redis.del(`portfolio:${userId}:${dateStr}`)
    }
  }

  static async clearMarketDataCache() {
    if (redis.isReady()) {
      // This would need a more sophisticated pattern matching in production
      DatabasePerformanceOptimizer.clearCache('market:')
    }
  }
}

export default EnhancedDatabaseService