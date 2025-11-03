/**
 * Portfolio Integration Tests
 * Integration tests for portfolio calculations and real-time updates
 */

import { PortfolioSimulator, type TradeOrder } from '@/lib/portfolio-simulator'
import SessionManager from '@/lib/session-manager'

// Mock external dependencies but allow internal integration
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    isReady: jest.fn(() => false),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(() => []),
  },
}))

// Mock database with in-memory data
const mockData = {
  users: new Map(),
  portfolios: new Map(),
  holdings: new Map(),
  orders: new Map(),
  trades: new Map(),
  ticks: new Map(),
  leaderboardEntries: new Map(),
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn((params) => {
        const user = mockData.users.get(params.where.id)
        return Promise.resolve(user || null)
      }),
      update: jest.fn((params) => {
        const user = mockData.users.get(params.where.id)
        if (user) {
          if (typeof params.data.cash === 'number') {
            user.cash = params.data.cash
          } else {
            Object.assign(user, params.data)
          }
        }
        return Promise.resolve(user)
      }),
      findMany: jest.fn(() => {
        return Promise.resolve(Array.from(mockData.users.values()))
      }),
    },
    portfolio: {
      findUnique: jest.fn((params) => {
        const key = `${params.where.user_id_session_date.user_id}-${params.where.user_id_session_date.session_date.toISOString()}`
        return Promise.resolve(mockData.portfolios.get(key) || null)
      }),
      create: jest.fn((params) => {
        const portfolio = {
          id: `portfolio-${Date.now()}`,
          ...params.data,
          created_at: new Date(),
          updated_at: new Date(),
        }
        const key = `${params.data.user_id}-${params.data.session_date.toISOString()}`
        mockData.portfolios.set(key, portfolio)
        return Promise.resolve(portfolio)
      }),
      update: jest.fn((params) => {
        const key = `${params.where.user_id_session_date.user_id}-${params.where.user_id_session_date.session_date.toISOString()}`
        const portfolio = mockData.portfolios.get(key)
        if (portfolio) {
          if (typeof params.data.current_cash === 'number') {
            portfolio.current_cash = params.data.current_cash
          } else {
            Object.assign(portfolio, params.data)
          }
          portfolio.updated_at = new Date()
        }
        return Promise.resolve(portfolio)
      }),
      createMany: jest.fn((params) => {
        params.data.forEach((item: any) => {
          const portfolio = {
            id: `portfolio-${Date.now()}-${Math.random()}`,
            ...item,
            created_at: new Date(),
            updated_at: new Date(),
          }
          const key = `${item.user_id}-${item.session_date.toISOString()}`
          mockData.portfolios.set(key, portfolio)
        })
        return Promise.resolve({ count: params.data.length })
      }),
      findMany: jest.fn((params) => {
        const portfolios = Array.from(mockData.portfolios.values())
        let filtered = portfolios
        
        if (params?.where?.user_id) {
          filtered = filtered.filter(p => p.user_id === params.where.user_id)
        }
        
        if (params?.orderBy?.session_date) {
          filtered.sort((a, b) => {
            const dateA = new Date(a.session_date).getTime()
            const dateB = new Date(b.session_date).getTime()
            return params.orderBy.session_date === 'desc' ? dateB - dateA : dateA - dateB
          })
        }
        
        if (params?.take) {
          filtered = filtered.slice(0, params.take)
        }
        
        return Promise.resolve(filtered)
      }),
      count: jest.fn((params) => {
        const portfolios = Array.from(mockData.portfolios.values())
        let filtered = portfolios
        
        if (params?.where?.session_date) {
          filtered = filtered.filter(p => {
            const portfolioDate = new Date(p.session_date).toDateString()
            const targetDate = new Date(params.where.session_date).toDateString()
            return portfolioDate === targetDate
          })
        }
        
        return Promise.resolve(filtered.length)
      }),
      aggregate: jest.fn((params) => {
        const portfolios = Array.from(mockData.portfolios.values())
        let filtered = portfolios
        
        if (params?.where?.session_date) {
          filtered = filtered.filter(p => {
            const portfolioDate = new Date(p.session_date).toDateString()
            const targetDate = new Date(params.where.session_date).toDateString()
            return portfolioDate === targetDate
          })
        }
        
        if (params?._avg?.day_change_percent) {
          const avg = filtered.reduce((sum, p) => sum + (p.day_change_percent || 0), 0) / filtered.length
          return Promise.resolve({ _avg: { day_change_percent: avg || 0 } })
        }
        
        return Promise.resolve({ _avg: { day_change_percent: 0 } })
      }),
    },
    holding: {
      findUnique: jest.fn((params) => {
        const key = `${params.where.user_id_symbol.user_id}-${params.where.user_id_symbol.symbol}`
        return Promise.resolve(mockData.holdings.get(key) || null)
      }),
      findMany: jest.fn((params) => {
        const holdings = Array.from(mockData.holdings.values())
        if (params?.where?.user_id) {
          return Promise.resolve(holdings.filter(h => h.user_id === params.where.user_id))
        }
        return Promise.resolve(holdings)
      }),
      upsert: jest.fn((params) => {
        const key = `${params.where.user_id_symbol.user_id}-${params.where.user_id_symbol.symbol}`
        let holding = mockData.holdings.get(key)
        
        if (holding) {
          Object.assign(holding, params.update)
          if (params.update.qty?.increment) {
            holding.qty += params.update.qty.increment
          }
        } else {
          holding = {
            id: `holding-${Date.now()}`,
            ...params.create,
          }
          mockData.holdings.set(key, holding)
        }
        
        return Promise.resolve(holding)
      }),
      update: jest.fn((params) => {
        const key = `${params.where.user_id_symbol.user_id}-${params.where.user_id_symbol.symbol}`
        const holding = mockData.holdings.get(key)
        if (holding) {
          Object.assign(holding, params.data)
          if (params.data.qty?.decrement) {
            holding.qty -= params.data.qty.decrement
          }
        }
        return Promise.resolve(holding)
      }),
      delete: jest.fn((params) => {
        const key = `${params.where.user_id_symbol.user_id}-${params.where.user_id_symbol.symbol}`
        const holding = mockData.holdings.get(key)
        if (holding) {
          mockData.holdings.delete(key)
        }
        return Promise.resolve(holding)
      }),
      deleteMany: jest.fn(() => {
        const count = mockData.holdings.size
        mockData.holdings.clear()
        return Promise.resolve({ count })
      }),
    },
    order: {
      create: jest.fn((params) => {
        const order = {
          id: `order-${Date.now()}`,
          ...params.data,
          created_at: new Date(),
          filled_at: params.data.status === 'FILLED' ? new Date() : null,
        }
        mockData.orders.set(order.id, order)
        return Promise.resolve(order)
      }),
      findMany: jest.fn(() => {
        return Promise.resolve(Array.from(mockData.orders.values()))
      }),
      count: jest.fn(() => {
        return Promise.resolve(mockData.orders.size)
      }),
    },
    trade: {
      create: jest.fn((params) => {
        const trade = {
          id: `trade-${Date.now()}`,
          ...params.data,
          timestamp: params.data.timestamp || new Date(),
        }
        mockData.trades.set(trade.id, trade)
        return Promise.resolve(trade)
      }),
      findMany: jest.fn((params) => {
        const trades = Array.from(mockData.trades.values())
        let filtered = trades
        
        if (params?.where?.OR) {
          filtered = filtered.filter(t => 
            params.where.OR.some((condition: any) => 
              (condition.buyer_id && t.buyer_id === condition.buyer_id) ||
              (condition.seller_id && t.seller_id === condition.seller_id)
            )
          )
        }
        
        if (params?.where?.timestamp) {
          filtered = filtered.filter(t => {
            const tradeTime = new Date(t.timestamp).getTime()
            const gte = params.where.timestamp.gte ? new Date(params.where.timestamp.gte).getTime() : 0
            const lt = params.where.timestamp.lt ? new Date(params.where.timestamp.lt).getTime() : Infinity
            return tradeTime >= gte && tradeTime < lt
          })
        }
        
        if (params?.orderBy?.timestamp) {
          filtered.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime()
            const timeB = new Date(b.timestamp).getTime()
            return params.orderBy.timestamp === 'desc' ? timeB - timeA : timeA - timeB
          })
        }
        
        return Promise.resolve(filtered)
      }),
      count: jest.fn((params) => {
        const trades = Array.from(mockData.trades.values())
        let filtered = trades
        
        if (params?.where?.timestamp) {
          filtered = filtered.filter(t => {
            const tradeTime = new Date(t.timestamp).getTime()
            const gte = params.where.timestamp.gte ? new Date(params.where.timestamp.gte).getTime() : 0
            const lt = params.where.timestamp.lt ? new Date(params.where.timestamp.lt).getTime() : Infinity
            return tradeTime >= gte && tradeTime < lt
          })
        }
        
        return Promise.resolve(filtered.length)
      }),
      aggregate: jest.fn((params) => {
        const trades = Array.from(mockData.trades.values())
        let filtered = trades
        
        if (params?.where?.timestamp) {
          filtered = filtered.filter(t => {
            const tradeTime = new Date(t.timestamp).getTime()
            const gte = params.where.timestamp.gte ? new Date(params.where.timestamp.gte).getTime() : 0
            const lt = params.where.timestamp.lt ? new Date(params.where.timestamp.lt).getTime() : Infinity
            return tradeTime >= gte && tradeTime < lt
          })
        }
        
        if (params?._sum?.price) {
          const sum = filtered.reduce((total, t) => total + (t.price * t.qty), 0)
          return Promise.resolve({ _sum: { price: sum } })
        }
        
        return Promise.resolve({ _sum: { price: 0 } })
      }),
    },
    leaderboardEntry: {
      createMany: jest.fn((params) => {
        params.data.forEach((item: any) => {
          const entry = {
            id: `entry-${Date.now()}-${Math.random()}`,
            ...item,
            created_at: new Date(),
          }
          const key = `${item.user_id}-${item.session_date.toISOString()}-${item.category}`
          mockData.leaderboardEntries.set(key, entry)
        })
        return Promise.resolve({ count: params.data.length })
      }),
    },
  },
}))

jest.mock('@/lib/enhanced-db', () => ({
  __esModule: true,
  default: {
    getCurrentPortfolio: jest.fn((userId, sessionDate) => {
      const date = sessionDate || new Date()
      const key = `${userId}-${date.toISOString()}`
      return Promise.resolve(mockData.portfolios.get(key) || {
        id: `portfolio-${userId}`,
        user_id: userId,
        session_date: date,
        starting_cash: 10000,
        current_cash: 10000,
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }),
    getLatestMarketData: jest.fn((symbols) => {
      const mockPrices = {
        'AAPL': 150.00,
        'GOOGL': 2900.00,
        'MSFT': 380.00,
        'TSLA': 250.00,
      }
      
      return Promise.resolve(
        (symbols || Object.keys(mockPrices)).map(symbol => ({
          id: `tick-${symbol}`,
          symbol,
          price: mockPrices[symbol as keyof typeof mockPrices] || 100.00,
          volume: 1000,
          bid: null,
          ask: null,
          change_24h: null,
          change_percent_24h: null,
          volatility: null,
          timestamp: new Date(),
        }))
      )
    }),
    updatePortfolioValue: jest.fn((userId, sessionDate, totalValue, dayChange) => {
      const key = `${userId}-${sessionDate.toISOString()}`
      const portfolio = mockData.portfolios.get(key)
      if (portfolio) {
        portfolio.total_value = totalValue
        portfolio.day_change = dayChange
        portfolio.day_change_percent = (dayChange / portfolio.starting_cash) * 100
        portfolio.updated_at = new Date()
      }
      return Promise.resolve(portfolio)
    }),
  },
}))

describe('Portfolio Integration Tests', () => {
  let simulator: PortfolioSimulator
  const testUserId = 'test-user-123'

  beforeEach(() => {
    simulator = new PortfolioSimulator()
    
    // Clear mock data
    Object.values(mockData).forEach(map => map.clear())
    
    // Setup test user
    mockData.users.set(testUserId, {
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      cash: 10000,
      created_at: new Date(),
      updated_at: new Date(),
      last_active: new Date(),
      preferences: {},
    })
    
    // Setup test portfolio
    const today = new Date()
    const portfolioKey = `${testUserId}-${today.toISOString()}`
    mockData.portfolios.set(portfolioKey, {
      id: 'test-portfolio',
      user_id: testUserId,
      session_date: today,
      starting_cash: 10000,
      current_cash: 10000,
      total_value: 10000,
      day_change: 0,
      day_change_percent: 0,
      created_at: new Date(),
      updated_at: new Date(),
    })
  })

  describe('Complete Trading Workflow', () => {
    test('should execute complete buy-sell cycle with correct calculations', async () => {
      // Step 1: Execute buy order
      const buyOrder: TradeOrder = {
        userId: testUserId,
        symbol: 'AAPL',
        side: 'buy',
        quantity: 10,
        orderType: 'market'
      }

      const buyResult = await simulator.executeOrder(buyOrder)
      expect(buyResult.success).toBe(true)
      expect(buyResult.executedPrice).toBe(150.00)
      expect(buyResult.executedQuantity).toBe(10)

      // Verify holding was created
      const holdingKey = `${testUserId}-AAPL`
      const holding = mockData.holdings.get(holdingKey)
      expect(holding).toBeDefined()
      expect(holding!.qty).toBe(10)
      expect(holding!.avg_cost).toBe(150.00)

      // Verify user cash was updated
      const user = mockData.users.get(testUserId)
      expect(user!.cash).toBe(8500) // 10000 - (10 * 150)

      // Step 2: Calculate portfolio value after buy
      const portfolioAfterBuy = await simulator.calculatePortfolioValue(testUserId)
      expect(portfolioAfterBuy.totalValue).toBe(10000) // Cash + holdings should equal starting value
      expect(portfolioAfterBuy.cashBalance).toBe(8500)
      expect(portfolioAfterBuy.holdingsValue).toBe(1500) // 10 * 150
      expect(portfolioAfterBuy.positions).toHaveLength(1)

      // Step 3: Execute partial sell order
      const sellOrder: TradeOrder = {
        userId: testUserId,
        symbol: 'AAPL',
        side: 'sell',
        quantity: 5,
        orderType: 'market'
      }

      const sellResult = await simulator.executeOrder(sellOrder)
      expect(sellResult.success).toBe(true)
      expect(sellResult.executedPrice).toBe(150.00)
      expect(sellResult.executedQuantity).toBe(5)

      // Verify holding was updated
      const updatedHolding = mockData.holdings.get(holdingKey)
      expect(updatedHolding!.qty).toBe(5)

      // Verify user cash was updated
      const updatedUser = mockData.users.get(testUserId)
      expect(updatedUser!.cash).toBe(9250) // 8500 + (5 * 150)

      // Step 4: Calculate final portfolio value
      const finalPortfolio = await simulator.calculatePortfolioValue(testUserId)
      expect(finalPortfolio.totalValue).toBe(10000) // Should still equal starting value
      expect(finalPortfolio.cashBalance).toBe(9250)
      expect(finalPortfolio.holdingsValue).toBe(750) // 5 * 150
      expect(finalPortfolio.positions).toHaveLength(1)
      expect(finalPortfolio.positions[0].quantity).toBe(5)
    })

    test('should handle multiple positions correctly', async () => {
      // Buy AAPL
      const aaplOrder: TradeOrder = {
        userId: testUserId,
        symbol: 'AAPL',
        side: 'buy',
        quantity: 5,
        orderType: 'market'
      }
      await simulator.executeOrder(aaplOrder)

      // Buy GOOGL
      const googlOrder: TradeOrder = {
        userId: testUserId,
        symbol: 'GOOGL',
        side: 'buy',
        quantity: 2,
        orderType: 'market'
      }
      await simulator.executeOrder(googlOrder)

      // Calculate portfolio value
      const portfolio = await simulator.calculatePortfolioValue(testUserId)
      
      expect(portfolio.positions).toHaveLength(2)
      expect(portfolio.holdingsValue).toBe(6550) // (5 * 150) + (2 * 2900)
      expect(portfolio.cashBalance).toBe(3450) // 10000 - 6550
      expect(portfolio.totalValue).toBe(10000)

      // Check individual positions
      const aaplPosition = portfolio.positions.find(p => p.symbol === 'AAPL')
      const googlPosition = portfolio.positions.find(p => p.symbol === 'GOOGL')
      
      expect(aaplPosition).toBeDefined()
      expect(aaplPosition!.quantity).toBe(5)
      expect(aaplPosition!.marketValue).toBe(750)
      
      expect(googlPosition).toBeDefined()
      expect(googlPosition!.quantity).toBe(2)
      expect(googlPosition!.marketValue).toBe(5800)
    })
  })

  describe('Performance Metrics Integration', () => {
    test('should calculate accurate performance metrics over multiple sessions', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

      // Create historical portfolio data
      const yesterdayKey = `${testUserId}-${yesterday.toISOString()}`
      mockData.portfolios.set(yesterdayKey, {
        id: 'yesterday-portfolio',
        user_id: testUserId,
        session_date: yesterday,
        starting_cash: 10000,
        current_cash: 5000,
        total_value: 10500,
        day_change: 500,
        day_change_percent: 5,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Create some trades
      mockData.trades.set('trade-1', {
        id: 'trade-1',
        symbol: 'AAPL',
        price: 150.00,
        qty: 10,
        buyer_id: testUserId,
        seller_id: 'market-maker',
        timestamp: yesterday,
      })

      mockData.trades.set('trade-2', {
        id: 'trade-2',
        symbol: 'AAPL',
        price: 155.00,
        qty: 5,
        buyer_id: 'market-maker',
        seller_id: testUserId,
        timestamp: today,
      })

      // Update today's portfolio
      const todayKey = `${testUserId}-${today.toISOString()}`
      const todayPortfolio = mockData.portfolios.get(todayKey)!
      todayPortfolio.total_value = 11200
      todayPortfolio.day_change = 1200
      todayPortfolio.day_change_percent = 12

      const metrics = await simulator.getPerformanceMetrics(testUserId)

      expect(metrics.totalTrades).toBe(2)
      expect(metrics.totalReturn).toBe(1200) // 11200 - 10000
      expect(metrics.totalReturnPercent).toBe(12)
      expect(metrics.dayChange).toBe(1200)
      expect(metrics.dayChangePercent).toBe(12)
      expect(metrics.volatility).toBeGreaterThan(0)
    })
  })

  describe('Session Management Integration', () => {
    test('should handle daily reset correctly', async () => {
      // Create multiple users
      const user2Id = 'test-user-456'
      mockData.users.set(user2Id, {
        id: user2Id,
        email: 'test2@example.com',
        name: 'Test User 2',
        username: 'testuser2',
        cash: 10000,
        created_at: new Date(),
        updated_at: new Date(),
        last_active: new Date(),
        preferences: {},
      })

      // Create some holdings that should be cleared
      mockData.holdings.set(`${testUserId}-AAPL`, {
        id: 'holding-1',
        user_id: testUserId,
        symbol: 'AAPL',
        qty: 10,
        avg_cost: 150.00,
      })

      expect(mockData.holdings.size).toBe(1)

      // Execute daily reset
      await simulator.resetDailyPortfolios()

      // Verify holdings were cleared
      expect(mockData.holdings.size).toBe(0)

      // Verify portfolios were created for all users
      const portfolios = Array.from(mockData.portfolios.values())
      const todayPortfolios = portfolios.filter(p => {
        const portfolioDate = new Date(p.session_date).toDateString()
        const today = new Date().toDateString()
        return portfolioDate === today
      })

      expect(todayPortfolios.length).toBe(2) // One for each user
      todayPortfolios.forEach(portfolio => {
        expect(portfolio.starting_cash).toBe(10000)
        expect(portfolio.current_cash).toBe(10000)
        expect(portfolio.total_value).toBe(10000)
      })
    })

    test('should get session statistics correctly', async () => {
      const today = new Date()
      
      // Create multiple portfolios for today
      const user2Id = 'test-user-456'
      mockData.users.set(user2Id, {
        id: user2Id,
        email: 'test2@example.com',
        name: 'Test User 2',
        username: 'testuser2',
        cash: 10000,
        created_at: new Date(),
        updated_at: new Date(),
        last_active: new Date(),
        preferences: {},
      })

      const portfolio2Key = `${user2Id}-${today.toISOString()}`
      mockData.portfolios.set(portfolio2Key, {
        id: 'portfolio-2',
        user_id: user2Id,
        session_date: today,
        starting_cash: 10000,
        current_cash: 8000,
        total_value: 11500,
        day_change: 1500,
        day_change_percent: 15,
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: user2Id,
          username: 'testuser2',
          name: 'Test User 2'
        }
      })

      // Create some trades for today
      mockData.trades.set('today-trade-1', {
        id: 'today-trade-1',
        symbol: 'AAPL',
        price: 150.00,
        qty: 10,
        buyer_id: testUserId,
        seller_id: 'market-maker',
        timestamp: today,
      })

      const stats = await SessionManager.getSessionStatistics(today)

      expect(stats.participantCount).toBe(2)
      expect(stats.totalTrades).toBe(1)
      expect(stats.totalVolume).toBe(1500) // 150 * 10
      expect(stats.averageReturn).toBe(7.5) // (0 + 15) / 2
    })
  })

  describe('Concurrent Trading Scenarios', () => {
    test('should handle concurrent orders correctly', async () => {
      // Simulate concurrent buy orders
      const orders: TradeOrder[] = [
        {
          userId: testUserId,
          symbol: 'AAPL',
          side: 'buy',
          quantity: 5,
          orderType: 'market'
        },
        {
          userId: testUserId,
          symbol: 'GOOGL',
          side: 'buy',
          quantity: 1,
          orderType: 'market'
        },
        {
          userId: testUserId,
          symbol: 'MSFT',
          side: 'buy',
          quantity: 3,
          orderType: 'market'
        }
      ]

      // Execute orders concurrently
      const results = await Promise.all(
        orders.map(order => simulator.executeOrder(order))
      )

      // All orders should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify final portfolio state
      const portfolio = await simulator.calculatePortfolioValue(testUserId)
      
      expect(portfolio.positions).toHaveLength(3)
      
      const totalExpectedValue = (5 * 150) + (1 * 2900) + (3 * 380) // AAPL + GOOGL + MSFT
      expect(portfolio.holdingsValue).toBe(totalExpectedValue)
      expect(portfolio.cashBalance).toBe(10000 - totalExpectedValue)
      expect(portfolio.totalValue).toBe(10000)
    })
  })
})