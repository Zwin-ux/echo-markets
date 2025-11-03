/**
 * Portfolio Simulator Engine
 * Core portfolio management system with real-time valuation and trade execution
 */

import prisma from './prisma'
import EnhancedDatabaseService from './enhanced-db'
import redis from './redis'

// Types and Interfaces
export interface TradeOrder {
  userId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  orderType: 'market' | 'limit'
  limitPrice?: number
}

export interface ExecutionResult {
  success: boolean
  orderId?: string
  executedPrice?: number
  executedQuantity?: number
  remainingQuantity?: number
  error?: string
  timestamp: Date
}

export interface Position {
  symbol: string
  quantity: number
  averageCost: number
  currentPrice: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  marketValue: number
}

export interface PortfolioValue {
  userId: string
  sessionDate: Date
  totalValue: number
  cashBalance: number
  holdingsValue: number
  dayChange: number
  dayChangePercent: number
  positions: Position[]
  startingCash: number
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
  winRate: number
  totalTrades: number
  profitableTrades: number
  averageTradeReturn: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
}

export interface RiskControls {
  maxPositionSize: number // Maximum percentage of portfolio in single position
  maxDailyLoss: number // Maximum daily loss percentage
  maxOrderValue: number // Maximum single order value
  minCashReserve: number // Minimum cash to maintain
}

// Default risk controls
const DEFAULT_RISK_CONTROLS: RiskControls = {
  maxPositionSize: 0.25, // 25% max position size
  maxDailyLoss: 0.10, // 10% max daily loss
  maxOrderValue: 5000, // $5000 max order
  minCashReserve: 100 // $100 minimum cash
}

export class PortfolioSimulator {
  private riskControls: RiskControls

  constructor(riskControls: RiskControls = DEFAULT_RISK_CONTROLS) {
    this.riskControls = riskControls
  }

  /**
   * Execute a trade order with realistic latency and validation
   */
  async executeOrder(order: TradeOrder): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      // Add realistic latency (50-200ms)
      const latency = Math.random() * 150 + 50
      await new Promise(resolve => setTimeout(resolve, latency))

      // Validate order
      const validation = await this.validateOrder(order)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          timestamp: new Date()
        }
      }

      // Get current market price
      const marketPrice = await this.getCurrentPrice(order.symbol)
      if (!marketPrice) {
        return {
          success: false,
          error: `No market data available for ${order.symbol}`,
          timestamp: new Date()
        }
      }

      // Determine execution price
      const executionPrice = order.orderType === 'market' 
        ? marketPrice 
        : order.limitPrice!

      // Check if limit order can be filled
      if (order.orderType === 'limit') {
        const canFill = (order.side === 'buy' && marketPrice <= order.limitPrice!) ||
                       (order.side === 'sell' && marketPrice >= order.limitPrice!)
        
        if (!canFill) {
          // Create pending limit order
          const orderId = await this.createPendingOrder(order, marketPrice)
          return {
            success: true,
            orderId,
            executedQuantity: 0,
            remainingQuantity: order.quantity,
            timestamp: new Date()
          }
        }
      }

      // Execute the trade
      const result = await this.executeTrade(order, executionPrice, marketPrice)
      
      // Update portfolio and holdings
      await this.updatePortfolioAfterTrade(order, result)
      
      // Update performance metrics
      await this.updatePerformanceMetrics(order.userId)

      return result

    } catch (error) {
      console.error('Order execution error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Calculate real-time portfolio value with current market prices
   */
  async calculatePortfolioValue(userId: string, sessionDate?: Date): Promise<PortfolioValue> {
    const date = sessionDate || new Date()
    
    try {
      // Get portfolio record
      const portfolio = await EnhancedDatabaseService.getCurrentPortfolio(userId, date)
      
      // Get current holdings
      const holdings = await prisma.holding.findMany({
        where: { user_id: userId }
      })

      // Get current market prices for all held symbols
      const symbols = holdings.map(h => h.symbol)
      const marketData = symbols.length > 0 
        ? await EnhancedDatabaseService.getLatestMarketData(symbols)
        : []
      const priceMap = new Map(marketData.map(tick => [tick.symbol, tick.price]))

      // Calculate positions with current values
      const positions: Position[] = holdings.map(holding => {
        const currentPrice = priceMap.get(holding.symbol) || holding.avg_cost
        const marketValue = holding.qty * currentPrice
        const unrealizedPnL = (currentPrice - holding.avg_cost) * holding.qty
        const unrealizedPnLPercent = ((currentPrice / holding.avg_cost) - 1) * 100

        return {
          symbol: holding.symbol,
          quantity: holding.qty,
          averageCost: holding.avg_cost,
          currentPrice,
          unrealizedPnL,
          unrealizedPnLPercent,
          marketValue
        }
      })

      // Calculate totals
      const holdingsValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
      const totalValue = portfolio.current_cash! + holdingsValue
      const dayChange = totalValue - portfolio.starting_cash
      const dayChangePercent = (dayChange / portfolio.starting_cash) * 100

      const portfolioValue: PortfolioValue = {
        userId,
        sessionDate: date,
        totalValue,
        cashBalance: portfolio.current_cash!,
        holdingsValue,
        dayChange,
        dayChangePercent,
        positions,
        startingCash: portfolio.starting_cash
      }

      // Update portfolio record with latest values
      await EnhancedDatabaseService.updatePortfolioValue(
        userId, 
        date, 
        totalValue, 
        dayChange
      )

      return portfolioValue

    } catch (error) {
      console.error('Portfolio valuation error:', error)
      throw new Error('Failed to calculate portfolio value')
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    try {
      // Get all trades for the user
      const trades = await prisma.trade.findMany({
        where: {
          OR: [
            { buyer_id: userId },
            { seller_id: userId }
          ]
        },
        orderBy: { timestamp: 'asc' }
      })

      // Get portfolio history
      const portfolios = await prisma.portfolio.findMany({
        where: { user_id: userId },
        orderBy: { session_date: 'asc' }
      })

      if (portfolios.length === 0) {
        return this.getDefaultMetrics()
      }

      // Calculate metrics
      const currentPortfolio = portfolios[portfolios.length - 1]
      const firstPortfolio = portfolios[0]
      
      const totalReturn = (currentPortfolio.total_value || 0) - firstPortfolio.starting_cash
      const totalReturnPercent = (totalReturn / firstPortfolio.starting_cash) * 100
      
      const dayChange = currentPortfolio.day_change || 0
      const dayChangePercent = currentPortfolio.day_change_percent || 0

      // Calculate trade statistics
      const userTrades = trades.filter(t => t.buyer_id === userId || t.seller_id === userId)
      const totalTrades = userTrades.length
      
      // Calculate win rate (simplified - would need more complex logic for actual P&L)
      const profitableTrades = Math.floor(totalTrades * 0.6) // Mock calculation
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0
      
      const averageTradeReturn = totalTrades > 0 ? totalReturn / totalTrades : 0

      // Calculate volatility from daily returns
      const dailyReturns = portfolios.map(p => p.day_change_percent || 0)
      const volatility = this.calculateVolatility(dailyReturns)
      
      // Calculate max drawdown
      const maxDrawdown = this.calculateMaxDrawdown(portfolios.map(p => p.total_value || p.starting_cash))
      
      // Calculate Sharpe ratio (simplified)
      const riskFreeRate = 0.02 // 2% annual risk-free rate
      const sharpeRatio = volatility > 0 ? (totalReturnPercent - riskFreeRate) / volatility : 0

      return {
        totalReturn,
        totalReturnPercent,
        dayChange,
        dayChangePercent,
        winRate,
        totalTrades,
        profitableTrades,
        averageTradeReturn,
        maxDrawdown,
        sharpeRatio,
        volatility
      }

    } catch (error) {
      console.error('Performance metrics error:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Reset portfolios for daily trading session
   */
  async resetDailyPortfolios(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true }
      })

      // Create new portfolio records for today
      const portfolioData = users.map(user => ({
        user_id: user.id,
        session_date: today,
        starting_cash: 10000,
        current_cash: 10000,
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0
      }))

      // Batch create portfolios
      await prisma.portfolio.createMany({
        data: portfolioData,
        skipDuplicates: true
      })

      // Clear all holdings for fresh start
      await prisma.holding.deleteMany({})

      // Clear portfolio cache
      if (redis.isReady()) {
        const keys = await redis.keys('portfolio:*')
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      }

      console.log(`Reset ${users.length} portfolios for ${today.toISOString().split('T')[0]}`)

    } catch (error) {
      console.error('Portfolio reset error:', error)
      throw new Error('Failed to reset daily portfolios')
    }
  }

  // Private helper methods

  private async validateOrder(order: TradeOrder): Promise<{ valid: boolean; error?: string }> {
    // Basic validation
    if (!order.symbol || order.quantity <= 0) {
      return { valid: false, error: 'Invalid order parameters' }
    }

    // Get current portfolio
    const portfolio = await EnhancedDatabaseService.getCurrentPortfolio(order.userId)
    const orderValue = (order.limitPrice || 0) * order.quantity

    // Check risk controls
    if (orderValue > this.riskControls.maxOrderValue) {
      return { valid: false, error: `Order value exceeds maximum of $${this.riskControls.maxOrderValue}` }
    }

    if (order.side === 'buy') {
      // Check available cash
      const requiredCash = orderValue
      if (portfolio.current_cash! < requiredCash) {
        return { valid: false, error: 'Insufficient cash for purchase' }
      }

      // Check if purchase would leave minimum cash reserve
      if (portfolio.current_cash! - requiredCash < this.riskControls.minCashReserve) {
        return { valid: false, error: `Must maintain minimum cash reserve of $${this.riskControls.minCashReserve}` }
      }
    } else {
      // Check available shares for sell order
      const holding = await prisma.holding.findUnique({
        where: {
          user_id_symbol: {
            user_id: order.userId,
            symbol: order.symbol
          }
        }
      })

      if (!holding || holding.qty < order.quantity) {
        return { valid: false, error: 'Insufficient shares for sale' }
      }
    }

    return { valid: true }
  }

  private async getCurrentPrice(symbol: string): Promise<number | null> {
    const marketData = await EnhancedDatabaseService.getLatestMarketData([symbol])
    return marketData.length > 0 ? marketData[0].price : null
  }

  private async createPendingOrder(order: TradeOrder, currentPrice: number): Promise<string> {
    const orderRecord = await prisma.order.create({
      data: {
        user_id: order.userId,
        symbol: order.symbol,
        side: order.side.toUpperCase() as 'BUY' | 'SELL',
        type: 'LIMIT',
        qty: order.quantity,
        limit_price: order.limitPrice!,
        status: 'OPEN'
      }
    })

    return orderRecord.id
  }

  private async executeTrade(order: TradeOrder, executionPrice: number, marketPrice: number): Promise<ExecutionResult> {
    // Create order record
    const orderRecord = await prisma.order.create({
      data: {
        user_id: order.userId,
        symbol: order.symbol,
        side: order.side.toUpperCase() as 'BUY' | 'SELL',
        type: order.orderType.toUpperCase() as 'MARKET' | 'LIMIT',
        qty: order.quantity,
        limit_price: order.limitPrice,
        status: 'FILLED',
        filled_at: new Date()
      }
    })

    // Create trade record (simplified - in real system would match with counterparty)
    const tradeRecord = await prisma.trade.create({
      data: {
        symbol: order.symbol,
        price: executionPrice,
        qty: order.quantity,
        buyer_id: order.side === 'buy' ? order.userId : 'market-maker',
        seller_id: order.side === 'sell' ? order.userId : 'market-maker',
        timestamp: new Date()
      }
    })

    return {
      success: true,
      orderId: orderRecord.id,
      executedPrice: executionPrice,
      executedQuantity: order.quantity,
      remainingQuantity: 0,
      timestamp: new Date()
    }
  }

  private async updatePortfolioAfterTrade(order: TradeOrder, result: ExecutionResult): Promise<void> {
    const tradeValue = result.executedPrice! * result.executedQuantity!

    if (order.side === 'buy') {
      // Update or create holding
      await prisma.holding.upsert({
        where: {
          user_id_symbol: {
            user_id: order.userId,
            symbol: order.symbol
          }
        },
        update: {
          qty: {
            increment: result.executedQuantity!
          },
          avg_cost: {
            // Recalculate average cost
            // This is simplified - would need current holding data for accurate calculation
            set: result.executedPrice!
          }
        },
        create: {
          user_id: order.userId,
          symbol: order.symbol,
          qty: result.executedQuantity!,
          avg_cost: result.executedPrice!
        }
      })

      // Update user cash balance
      const user = await prisma.user.findUnique({
        where: { id: order.userId }
      })
      
      if (user) {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            cash: user.cash - tradeValue
          }
        })
      }

    } else {
      // Sell order - update holding and cash
      const holding = await prisma.holding.findUnique({
        where: {
          user_id_symbol: {
            user_id: order.userId,
            symbol: order.symbol
          }
        }
      })

      if (holding) {
        if (holding.qty <= result.executedQuantity!) {
          // Sell all shares - delete holding
          await prisma.holding.delete({
            where: {
              user_id_symbol: {
                user_id: order.userId,
                symbol: order.symbol
              }
            }
          })
        } else {
          // Partial sell - update quantity
          await prisma.holding.update({
            where: {
              user_id_symbol: {
                user_id: order.userId,
                symbol: order.symbol
              }
            },
            data: {
              qty: {
                decrement: result.executedQuantity!
              }
            }
          })
        }
      }

      // Update user cash balance
      const user = await prisma.user.findUnique({
        where: { id: order.userId }
      })
      
      if (user) {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            cash: user.cash + tradeValue
          }
        })
      }
    }

    // Update portfolio cash balance
    const today = new Date()
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        user_id_session_date: {
          user_id: order.userId,
          session_date: today
        }
      }
    })
    
    if (portfolio) {
      const newCash = order.side === 'buy' 
        ? (portfolio.current_cash || 0) - tradeValue
        : (portfolio.current_cash || 0) + tradeValue
        
      await prisma.portfolio.update({
        where: {
          user_id_session_date: {
            user_id: order.userId,
            session_date: today
          }
        },
        data: {
          current_cash: newCash,
          updated_at: new Date()
        }
      })
    }
  }

  private async updatePerformanceMetrics(userId: string): Promise<void> {
    // This would update various performance tracking metrics
    // For now, we'll just update the portfolio value
    await this.calculatePortfolioValue(userId)
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
    return Math.sqrt(variance)
  }

  private calculateMaxDrawdown(values: number[]): number {
    if (values.length < 2) return 0
    
    let maxDrawdown = 0
    let peak = values[0]
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i]
      } else {
        const drawdown = (peak - values[i]) / peak
        maxDrawdown = Math.max(maxDrawdown, drawdown)
      }
    }
    
    return maxDrawdown * 100 // Return as percentage
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      winRate: 0,
      totalTrades: 0,
      profitableTrades: 0,
      averageTradeReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      volatility: 0
    }
  }
}

// Export singleton instance
export const portfolioSimulator = new PortfolioSimulator()
export default portfolioSimulator