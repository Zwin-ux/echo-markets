/**
 * Portfolio Simulator Tests
 * Unit tests for trade execution logic and portfolio calculations
 */

import { PortfolioSimulator, type TradeOrder } from '@/lib/portfolio-simulator'
import SessionManager from '@/lib/session-manager'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    portfolio: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    holding: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trade: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    leaderboardEntry: {
      createMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('@/lib/enhanced-db', () => ({
  __esModule: true,
  default: {
    getCurrentPortfolio: jest.fn(),
    getLatestMarketData: jest.fn(),
    updatePortfolioValue: jest.fn(),
  },
}))

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    isReady: jest.fn(() => false),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}))

import prisma from '@/lib/prisma'
import EnhancedDatabaseService from '@/lib/enhanced-db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockEnhancedDb = EnhancedDatabaseService as jest.Mocked<typeof EnhancedDatabaseService>

describe('PortfolioSimulator', () => {
  let simulator: PortfolioSimulator

  beforeEach(() => {
    simulator = new PortfolioSimulator()
    jest.clearAllMocks()
  })

  describe('executeOrder', () => {
    const mockUserId = 'user-123'
    const mockSymbol = 'AAPL'

    beforeEach(() => {
      // Mock portfolio data
      mockEnhancedDb.getCurrentPortfolio.mockResolvedValue({
        id: 'portfolio-123',
        user_id: mockUserId,
        session_date: new Date(),
        starting_cash: 10000,
        current_cash: 5000,
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Mock market data
      mockEnhancedDb.getLatestMarketData.mockResolvedValue([
        {
          id: 'tick-123',
          symbol: mockSymbol,
          price: 150.00,
          volume: 1000,
          bid: 149.95,
          ask: 150.05,
          change_24h: 2.50,
          change_percent_24h: 1.69,
          volatility: 0.25,
          timestamp: new Date(),
        }
      ])
    })

    test('should execute valid buy market order', async () => {
      const order: TradeOrder = {
        userId: mockUserId,
        symbol: mockSymbol,
        side: 'buy',
        quantity: 10,
        orderType: 'market'
      }

      // Mock successful order creation
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-123',
        user_id: mockUserId,
        symbol: mockSymbol,
        side: 'BUY',
        type: 'MARKET',
        qty: 10,
        limit_price: null,
        status: 'FILLED',
        created_at: new Date(),
        filled_at: new Date(),
      })

      // Mock trade creation
      mockPrisma.trade.create.mockResolvedValue({
        id: 'trade-123',
        symbol: mockSymbol,
        price: 150.00,
        qty: 10,
        buyer_id: mockUserId,
        seller_id: 'market-maker',
        timestamp: new Date(),
      })

      // Mock holding upsert
      mockPrisma.holding.upsert.mockResolvedValue({
        id: 'holding-123',
        user_id: mockUserId,
        symbol: mockSymbol,
        qty: 10,
        avg_cost: 150.00,
      })

      // Mock user cash update
      mockPrisma.user.update.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        cash: 3500, // 5000 - (10 * 150)
        created_at: new Date(),
        updated_at: new Date(),
        last_active: new Date(),
        preferences: {},
      })

      // Mock portfolio update
      mockPrisma.portfolio.update.mockResolvedValue({
        id: 'portfolio-123',
        user_id: mockUserId,
        session_date: new Date(),
        starting_cash: 10000,
        current_cash: 3500,
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })

      const result = await simulator.executeOrder(order)

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-123')
      expect(result.executedPrice).toBe(150.00)
      expect(result.executedQuantity).toBe(10)
      expect(result.remainingQuantity).toBe(0)
    })

    test('should execute valid sell market order', async () => {
      const order: TradeOrder = {
        userId: mockUserId,
        symbol: mockSymbol,
        side: 'sell',
        quantity: 5,
        orderType: 'market'
      }

      // Mock existing holding
      mockPrisma.holding.findUnique.mockResolvedValue({
        id: 'holding-123',
        user_id: mockUserId,
        symbol: mockSymbol,
        qty: 10,
        avg_cost: 140.00,
      })

      // Mock successful order creation
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-124',
        user_id: mockUserId,
        symbol: mockSymbol,
        side: 'SELL',
        type: 'MARKET',
        qty: 5,
        limit_price: null,
        status: 'FILLED',
        created_at: new Date(),
        filled_at: new Date(),
      })

      // Mock trade creation
      mockPrisma.trade.create.mockResolvedValue({
        id: 'trade-124',
        symbol: mockSymbol,
        price: 150.00,
        qty: 5,
        buyer_id: 'market-maker',
        seller_id: mockUserId,
        timestamp: new Date(),
      })

      // Mock holding update
      mockPrisma.holding.update.mockResolvedValue({
        id: 'holding-123',
        user_id: mockUserId,
        symbol: mockSymbol,
        qty: 5,
        avg_cost: 140.00,
      })

      // Mock user cash update
      mockPrisma.user.update.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        cash: 5750, // 5000 + (5 * 150)
        created_at: new Date(),
        updated_at: new Date(),
        last_active: new Date(),
        preferences: {},
      })

      const result = await simulator.executeOrder(order)

      expect(result.success).toBe(true)
      expect(result.executedPrice).toBe(150.00)
      expect(result.executedQuantity).toBe(5)
    })

    test('should reject order with insufficient cash', async () => {
      // Mock portfolio with insufficient cash
      mockEnhancedDb.getCurrentPortfolio.mockResolvedValue({
        id: 'portfolio-123',
        user_id: mockUserId,
        session_date: new Date(),
        starting_cash: 10000,
        current_cash: 100, // Not enough for 10 shares at $150
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })

      const order: TradeOrder = {
        userId: mockUserId,
        symbol: mockSymbol,
        side: 'buy',
        quantity: 10,
        orderType: 'market'
      }

      const result = await simulator.executeOrder(order)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient cash')
    })

    test('should reject sell order with insufficient shares', async () => {
      // Mock no existing holding
      mockPrisma.holding.findUnique.mockResolvedValue(null)

      const order: TradeOrder = {
        userId: mockUserId,
        symbol: mockSymbol,
        side: 'sell',
        quantity: 10,
        orderType: 'market'
      }

      const result = await simulator.executeOrder(order)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient shares')
    })

    test('should handle limit orders correctly', async () => {
      const order: TradeOrder = {
        userId: mockUserId,
        symbol: mockSymbol,
        side: 'buy',
        quantity: 10,
        orderType: 'limit',
        limitPrice: 145.00 // Below current market price of 150
      }

      // Mock pending order creation
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-125',
        user_id: mockUserId,
        symbol: mockSymbol,
        side: 'BUY',
        type: 'LIMIT',
        qty: 10,
        limit_price: 145.00,
        status: 'OPEN',
        created_at: new Date(),
        filled_at: null,
      })

      const result = await simulator.executeOrder(order)

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-125')
      expect(result.executedQuantity).toBe(0)
      expect(result.remainingQuantity).toBe(10)
    })
  })

  describe('calculatePortfolioValue', () => {
    const mockUserId = 'user-123'

    test('should calculate portfolio value correctly', async () => {
      const mockDate = new Date()
      
      // Mock portfolio
      mockEnhancedDb.getCurrentPortfolio.mockResolvedValue({
        id: 'portfolio-123',
        user_id: mockUserId,
        session_date: mockDate,
        starting_cash: 10000,
        current_cash: 5000,
        total_value: 12000,
        day_change: 2000,
        day_change_percent: 20,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Mock holdings
      mockPrisma.holding.findMany.mockResolvedValue([
        {
          id: 'holding-1',
          user_id: mockUserId,
          symbol: 'AAPL',
          qty: 10,
          avg_cost: 140.00,
        },
        {
          id: 'holding-2',
          user_id: mockUserId,
          symbol: 'GOOGL',
          qty: 5,
          avg_cost: 2800.00,
        }
      ])

      // Mock market data
      mockEnhancedDb.getLatestMarketData.mockResolvedValue([
        {
          id: 'tick-1',
          symbol: 'AAPL',
          price: 150.00,
          volume: 1000,
          bid: null,
          ask: null,
          change_24h: null,
          change_percent_24h: null,
          volatility: null,
          timestamp: new Date(),
        },
        {
          id: 'tick-2',
          symbol: 'GOOGL',
          price: 2900.00,
          volume: 500,
          bid: null,
          ask: null,
          change_24h: null,
          change_percent_24h: null,
          volatility: null,
          timestamp: new Date(),
        }
      ])

      const result = await simulator.calculatePortfolioValue(mockUserId, mockDate)

      expect(result.userId).toBe(mockUserId)
      expect(result.cashBalance).toBe(5000)
      expect(result.holdingsValue).toBe(16000) // (10 * 150) + (5 * 2900)
      expect(result.totalValue).toBe(21000) // 5000 + 16000
      expect(result.positions).toHaveLength(2)
      
      // Check AAPL position
      const aaplPosition = result.positions.find(p => p.symbol === 'AAPL')
      expect(aaplPosition).toBeDefined()
      expect(aaplPosition!.quantity).toBe(10)
      expect(aaplPosition!.currentPrice).toBe(150.00)
      expect(aaplPosition!.unrealizedPnL).toBe(100) // (150 - 140) * 10
      expect(aaplPosition!.unrealizedPnLPercent).toBeCloseTo(7.14, 2) // ((150/140) - 1) * 100
    })
  })

  describe('getPerformanceMetrics', () => {
    const mockUserId = 'user-123'

    test('should calculate performance metrics correctly', async () => {
      // Mock trades
      mockPrisma.trade.findMany.mockResolvedValue([
        {
          id: 'trade-1',
          symbol: 'AAPL',
          price: 150.00,
          qty: 10,
          buyer_id: mockUserId,
          seller_id: 'market-maker',
          timestamp: new Date(),
        },
        {
          id: 'trade-2',
          symbol: 'AAPL',
          price: 155.00,
          qty: 5,
          buyer_id: 'market-maker',
          seller_id: mockUserId,
          timestamp: new Date(),
        }
      ])

      // Mock portfolios
      mockPrisma.portfolio.findMany.mockResolvedValue([
        {
          id: 'portfolio-1',
          user_id: mockUserId,
          session_date: new Date('2024-01-01'),
          starting_cash: 10000,
          current_cash: 5000,
          total_value: 10500,
          day_change: 500,
          day_change_percent: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'portfolio-2',
          user_id: mockUserId,
          session_date: new Date('2024-01-02'),
          starting_cash: 10000,
          current_cash: 4000,
          total_value: 11200,
          day_change: 1200,
          day_change_percent: 12,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ])

      const result = await simulator.getPerformanceMetrics(mockUserId)

      expect(result.totalTrades).toBe(2)
      expect(result.totalReturn).toBe(1200) // 11200 - 10000
      expect(result.totalReturnPercent).toBe(12) // (1200 / 10000) * 100
      expect(result.dayChange).toBe(1200)
      expect(result.dayChangePercent).toBe(12)
      expect(result.volatility).toBeGreaterThan(0)
    })

    test('should return default metrics for user with no data', async () => {
      mockPrisma.trade.findMany.mockResolvedValue([])
      mockPrisma.portfolio.findMany.mockResolvedValue([])

      const result = await simulator.getPerformanceMetrics(mockUserId)

      expect(result.totalTrades).toBe(0)
      expect(result.totalReturn).toBe(0)
      expect(result.totalReturnPercent).toBe(0)
      expect(result.winRate).toBe(0)
    })
  })

  describe('resetDailyPortfolios', () => {
    test('should reset all portfolios successfully', async () => {
      // Mock users
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' }
      ])

      // Mock portfolio creation
      mockPrisma.portfolio.createMany.mockResolvedValue({ count: 3 })

      // Mock holdings deletion
      mockPrisma.holding.deleteMany.mockResolvedValue({ count: 10 })

      await simulator.resetDailyPortfolios()

      expect(mockPrisma.user.findMany).toHaveBeenCalled()
      expect(mockPrisma.portfolio.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user-1',
            starting_cash: 10000,
            current_cash: 10000,
            total_value: 10000
          })
        ]),
        skipDuplicates: true
      })
      expect(mockPrisma.holding.deleteMany).toHaveBeenCalled()
    })
  })
})

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentSession', () => {
    test('should return current session', async () => {
      // Mock portfolio count
      mockPrisma.portfolio.count.mockResolvedValue(5)

      const session = await SessionManager.getCurrentSession()

      expect(session).toBeDefined()
      expect(session!.id).toContain('session-')
      expect(session!.status).toMatch(/scheduled|active|closed/)
    })
  })

  describe('isTradingActive', () => {
    test('should return false when no session exists', async () => {
      mockPrisma.portfolio.count.mockResolvedValue(0)

      const isActive = await SessionManager.isTradingActive()

      expect(isActive).toBe(false)
    })
  })

  describe('getSessionStatistics', () => {
    test('should return session statistics', async () => {
      const mockDate = new Date()

      // Mock participant count
      mockPrisma.portfolio.count.mockResolvedValue(10)

      // Mock trade count
      mockPrisma.trade.count.mockResolvedValue(50)

      // Mock volume aggregate
      mockPrisma.trade.aggregate.mockResolvedValue({
        _sum: { price: 75000 }
      })

      // Mock top portfolios
      mockPrisma.portfolio.findMany.mockResolvedValue([
        {
          id: 'portfolio-1',
          user_id: 'user-1',
          session_date: mockDate,
          starting_cash: 10000,
          current_cash: 5000,
          total_value: 12000,
          day_change: 2000,
          day_change_percent: 20,
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: 'user-1',
            username: 'trader1',
            name: 'Trader One'
          }
        }
      ])

      // Mock average aggregate
      mockPrisma.portfolio.aggregate.mockResolvedValue({
        _avg: { day_change_percent: 5.5 }
      })

      const stats = await SessionManager.getSessionStatistics(mockDate)

      expect(stats.participantCount).toBe(10)
      expect(stats.totalTrades).toBe(50)
      expect(stats.totalVolume).toBe(75000)
      expect(stats.averageReturn).toBe(5.5)
      expect(stats.topPerformers).toHaveLength(1)
      expect(stats.topPerformers[0].username).toBe('trader1')
      expect(stats.topPerformers[0].return).toBe(20)
    })
  })
})