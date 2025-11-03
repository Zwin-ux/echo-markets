/**
 * Session Manager
 * Handles daily portfolio resets, session-based trading periods, and historical tracking
 */

import prisma from './prisma'
import EnhancedDatabaseService from './enhanced-db'
import redis from './redis'
import { portfolioSimulator } from './portfolio-simulator'

export interface TradingSession {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  status: 'scheduled' | 'active' | 'closed'
  participantCount: number
  totalVolume: number
  topPerformer?: {
    userId: string
    username: string
    return: number
  }
}

export interface SessionSnapshot {
  userId: string
  sessionDate: Date
  startingCash: number
  endingValue: number
  totalReturn: number
  returnPercent: number
  tradesCount: number
  positions: Array<{
    symbol: string
    quantity: number
    averageCost: number
    finalPrice: number
    pnl: number
  }>
  rank?: number
}

export interface HistoricalPerformance {
  userId: string
  sessions: SessionSnapshot[]
  totalSessions: number
  winRate: number
  averageReturn: number
  bestSession: SessionSnapshot
  worstSession: SessionSnapshot
  currentStreak: number
  longestWinStreak: number
}

export class SessionManager {
  private static readonly TRADING_HOURS = {
    start: { hour: 9, minute: 30 }, // 9:30 AM
    end: { hour: 16, minute: 0 }    // 4:00 PM
  }

  private static readonly SESSION_CACHE_TTL = 3600 // 1 hour

  /**
   * Get current trading session
   */
  static async getCurrentSession(): Promise<TradingSession | null> {
    const today = new Date()
    const cacheKey = `session:${today.toISOString().split('T')[0]}`

    // Try cache first
    if (redis.isReady()) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    // Check if session exists in database
    let session = await this.getSessionFromDatabase(today)
    
    if (!session) {
      // Create new session for today
      session = await this.createTradingSession(today)
    }

    // Update session status based on current time
    session = await this.updateSessionStatus(session)

    // Cache the session
    if (redis.isReady()) {
      await redis.set(cacheKey, JSON.stringify(session), this.SESSION_CACHE_TTL)
    }

    return session
  }

  /**
   * Initialize daily portfolio reset
   */
  static async initializeDailyReset(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      console.log('Starting daily portfolio reset...')

      // Create snapshots of previous session before reset
      await this.createSessionSnapshots(today)

      // Reset all portfolios
      await portfolioSimulator.resetDailyPortfolios()

      // Create new trading session
      await this.createTradingSession(today)

      // Update leaderboards
      await this.initializeLeaderboards(today)

      // Clear relevant caches
      await this.clearSessionCaches()

      console.log('Daily portfolio reset completed successfully')

    } catch (error) {
      console.error('Daily reset failed:', error)
      throw new Error('Failed to initialize daily reset')
    }
  }

  /**
   * Create session snapshot for historical tracking
   */
  static async createSessionSnapshot(userId: string, sessionDate: Date): Promise<SessionSnapshot> {
    try {
      // Get final portfolio state
      const portfolio = await EnhancedDatabaseService.getCurrentPortfolio(userId, sessionDate)
      
      // Get final holdings
      const holdings = await prisma.holding.findMany({
        where: { user_id: userId }
      })

      // Get market prices for final valuation
      const symbols = holdings.map(h => h.symbol)
      const marketData = await EnhancedDatabaseService.getLatestMarketData(symbols)
      const priceMap = new Map(marketData.map(tick => [tick.symbol, tick.price]))

      // Calculate final positions
      const positions = holdings.map(holding => {
        const finalPrice = priceMap.get(holding.symbol) || holding.avg_cost
        const pnl = (finalPrice - holding.avg_cost) * holding.qty
        
        return {
          symbol: holding.symbol,
          quantity: holding.qty,
          averageCost: holding.avg_cost,
          finalPrice,
          pnl
        }
      })

      // Get trade count for the session
      const tradesCount = await prisma.trade.count({
        where: {
          OR: [
            { buyer_id: userId },
            { seller_id: userId }
          ],
          timestamp: {
            gte: sessionDate,
            lt: new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      const snapshot: SessionSnapshot = {
        userId,
        sessionDate,
        startingCash: portfolio.starting_cash,
        endingValue: portfolio.total_value || portfolio.starting_cash,
        totalReturn: (portfolio.total_value || portfolio.starting_cash) - portfolio.starting_cash,
        returnPercent: ((portfolio.total_value || portfolio.starting_cash) / portfolio.starting_cash - 1) * 100,
        tradesCount,
        positions
      }

      return snapshot

    } catch (error) {
      console.error('Failed to create session snapshot:', error)
      throw new Error('Failed to create session snapshot')
    }
  }

  /**
   * Get historical performance for a user
   */
  static async getHistoricalPerformance(userId: string, limit: number = 30): Promise<HistoricalPerformance> {
    try {
      // Get recent portfolio sessions
      const portfolios = await prisma.portfolio.findMany({
        where: { user_id: userId },
        orderBy: { session_date: 'desc' },
        take: limit
      })

      if (portfolios.length === 0) {
        return this.getEmptyHistoricalPerformance(userId)
      }

      // Create snapshots for each session
      const sessions: SessionSnapshot[] = []
      for (const portfolio of portfolios) {
        const snapshot = await this.createSessionSnapshot(userId, portfolio.session_date)
        sessions.push(snapshot)
      }

      // Calculate statistics
      const totalSessions = sessions.length
      const profitableSessions = sessions.filter(s => s.totalReturn > 0).length
      const winRate = (profitableSessions / totalSessions) * 100
      
      const averageReturn = sessions.reduce((sum, s) => sum + s.returnPercent, 0) / totalSessions
      
      const bestSession = sessions.reduce((best, current) => 
        current.returnPercent > best.returnPercent ? current : best
      )
      
      const worstSession = sessions.reduce((worst, current) => 
        current.returnPercent < worst.returnPercent ? current : worst
      )

      // Calculate current streak
      let currentStreak = 0
      for (const session of sessions) {
        if (session.totalReturn > 0) {
          currentStreak++
        } else {
          break
        }
      }

      // Calculate longest win streak
      let longestWinStreak = 0
      let currentWinStreak = 0
      for (const session of sessions.reverse()) {
        if (session.totalReturn > 0) {
          currentWinStreak++
          longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
        } else {
          currentWinStreak = 0
        }
      }

      return {
        userId,
        sessions: sessions.reverse(), // Return in chronological order
        totalSessions,
        winRate,
        averageReturn,
        bestSession,
        worstSession,
        currentStreak,
        longestWinStreak
      }

    } catch (error) {
      console.error('Failed to get historical performance:', error)
      return this.getEmptyHistoricalPerformance(userId)
    }
  }

  /**
   * Check if trading is currently active
   */
  static async isTradingActive(): Promise<boolean> {
    const session = await this.getCurrentSession()
    if (!session) return false

    const now = new Date()
    return session.status === 'active' && 
           now >= session.startTime && 
           now <= session.endTime
  }

  /**
   * Get session statistics
   */
  static async getSessionStatistics(sessionDate?: Date): Promise<{
    participantCount: number
    totalTrades: number
    totalVolume: number
    averageReturn: number
    topPerformers: Array<{
      userId: string
      username: string
      return: number
      rank: number
    }>
  }> {
    const date = sessionDate || new Date()
    
    try {
      // Get participant count
      const participantCount = await prisma.portfolio.count({
        where: { session_date: date }
      })

      // Get total trades for the session
      const totalTrades = await prisma.trade.count({
        where: {
          timestamp: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      // Calculate total volume
      const volumeResult = await prisma.trade.aggregate({
        where: {
          timestamp: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          price: true
        }
      })
      const totalVolume = volumeResult._sum.price || 0

      // Get top performers
      const topPortfolios = await prisma.portfolio.findMany({
        where: { session_date: date },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        },
        orderBy: { day_change_percent: 'desc' },
        take: 10
      })

      const topPerformers = topPortfolios.map((portfolio, index) => ({
        userId: portfolio.user_id,
        username: portfolio.user?.username || portfolio.user?.name || 'Anonymous',
        return: portfolio.day_change_percent || 0,
        rank: index + 1
      }))

      // Calculate average return
      const avgResult = await prisma.portfolio.aggregate({
        where: { session_date: date },
        _avg: {
          day_change_percent: true
        }
      })
      const averageReturn = avgResult._avg.day_change_percent || 0

      return {
        participantCount,
        totalTrades,
        totalVolume,
        averageReturn,
        topPerformers
      }

    } catch (error) {
      console.error('Failed to get session statistics:', error)
      return {
        participantCount: 0,
        totalTrades: 0,
        totalVolume: 0,
        averageReturn: 0,
        topPerformers: []
      }
    }
  }

  // Private helper methods

  private static async getSessionFromDatabase(date: Date): Promise<TradingSession | null> {
    // For now, we'll generate session data based on portfolio records
    // In a full implementation, you might have a dedicated sessions table
    
    const portfolioCount = await prisma.portfolio.count({
      where: { session_date: date }
    })

    if (portfolioCount === 0) return null

    const sessionId = `session-${date.toISOString().split('T')[0]}`
    const startTime = new Date(date)
    startTime.setHours(this.TRADING_HOURS.start.hour, this.TRADING_HOURS.start.minute, 0, 0)
    
    const endTime = new Date(date)
    endTime.setHours(this.TRADING_HOURS.end.hour, this.TRADING_HOURS.end.minute, 0, 0)

    return {
      id: sessionId,
      date,
      startTime,
      endTime,
      status: 'scheduled',
      participantCount: portfolioCount,
      totalVolume: 0
    }
  }

  private static async createTradingSession(date: Date): Promise<TradingSession> {
    const sessionId = `session-${date.toISOString().split('T')[0]}`
    const startTime = new Date(date)
    startTime.setHours(this.TRADING_HOURS.start.hour, this.TRADING_HOURS.start.minute, 0, 0)
    
    const endTime = new Date(date)
    endTime.setHours(this.TRADING_HOURS.end.hour, this.TRADING_HOURS.end.minute, 0, 0)

    const session: TradingSession = {
      id: sessionId,
      date,
      startTime,
      endTime,
      status: 'scheduled',
      participantCount: 0,
      totalVolume: 0
    }

    return session
  }

  private static async updateSessionStatus(session: TradingSession): Promise<TradingSession> {
    const now = new Date()
    
    if (now < session.startTime) {
      session.status = 'scheduled'
    } else if (now >= session.startTime && now <= session.endTime) {
      session.status = 'active'
    } else {
      session.status = 'closed'
    }

    return session
  }

  private static async createSessionSnapshots(date: Date): Promise<void> {
    const previousDate = new Date(date.getTime() - 24 * 60 * 60 * 1000)
    
    // Get all portfolios from previous session
    const portfolios = await prisma.portfolio.findMany({
      where: { session_date: previousDate }
    })

    // Create snapshots for each user
    for (const portfolio of portfolios) {
      try {
        await this.createSessionSnapshot(portfolio.user_id, previousDate)
      } catch (error) {
        console.error(`Failed to create snapshot for user ${portfolio.user_id}:`, error)
      }
    }
  }

  private static async initializeLeaderboards(date: Date): Promise<void> {
    // Initialize daily leaderboard entries
    const users = await prisma.user.findMany({
      select: { id: true }
    })

    const leaderboardEntries = users.map(user => ({
      user_id: user.id,
      session_date: date,
      category: 'daily_return',
      score: 0
    }))

    await prisma.leaderboardEntry.createMany({
      data: leaderboardEntries,
      skipDuplicates: true
    })
  }

  private static async clearSessionCaches(): Promise<void> {
    if (redis.isReady()) {
      const keys = await redis.keys('session:*')
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }

  private static getEmptyHistoricalPerformance(userId: string): HistoricalPerformance {
    const emptySnapshot: SessionSnapshot = {
      userId,
      sessionDate: new Date(),
      startingCash: 10000,
      endingValue: 10000,
      totalReturn: 0,
      returnPercent: 0,
      tradesCount: 0,
      positions: []
    }

    return {
      userId,
      sessions: [],
      totalSessions: 0,
      winRate: 0,
      averageReturn: 0,
      bestSession: emptySnapshot,
      worstSession: emptySnapshot,
      currentStreak: 0,
      longestWinStreak: 0
    }
  }
}

export default SessionManager