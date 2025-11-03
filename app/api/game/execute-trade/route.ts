/**
 * Enhanced Trade Execution API
 * MMO-style trading with XP, achievements, and social features
 */

import { NextRequest, NextResponse } from 'next/server'
import { PortfolioSimulator } from '@/lib/portfolio-simulator'
import EnhancedDatabaseService from '@/lib/enhanced-db'
import { marketEngine } from '@/lib/market-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, symbol, side, amount, type = 'market' } = body

    if (!playerId || !symbol || !side || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current market price
    const marketData = await EnhancedDatabaseService.getLatestMarketData([symbol])
    const currentPrice = marketData.find(d => d.symbol === symbol)?.price || 100

    // Calculate trade details
    const shares = Math.floor(amount / currentPrice)
    const totalCost = shares * currentPrice

    // Execute trade using portfolio simulator
    const simulator = new PortfolioSimulator()
    const order = {
      id: `order-${Date.now()}`,
      userId: playerId,
      symbol,
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      qty: shares,
      limitPrice: type === 'limit' ? currentPrice : null,
      status: 'OPEN' as const,
      createdAt: Date.now()
    }

    const result = await simulator.executeOrder(order)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    // Calculate XP and achievements
    const xpGained = Math.floor(totalCost / 100) // 1 XP per $100 traded
    const achievements = checkAchievements(playerId, {
      tradeAmount: totalCost,
      symbol,
      side,
      shares
    })

    // Update player stats
    await updatePlayerStats(playerId, {
      xpGained,
      tradesExecuted: 1,
      volumeTraded: totalCost
    })

    // Generate social feed entry
    const feedEntry = generateTradeFeedEntry(playerId, {
      symbol,
      side,
      shares,
      price: currentPrice,
      impact: calculateMarketImpact(totalCost, symbol)
    })

    return NextResponse.json({
      success: true,
      data: {
        trade: {
          orderId: result.orderId,
          symbol,
          side,
          shares,
          executedPrice: result.executedPrice,
          totalCost,
          timestamp: new Date().toISOString()
        },
        rewards: {
          xpGained,
          achievements,
          levelUp: checkLevelUp(xpGained)
        },
        socialFeed: feedEntry,
        marketImpact: calculateMarketImpact(totalCost, symbol)
      }
    })
  } catch (error) {
    console.error('Trade execution error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute trade' },
      { status: 500 }
    )
  }
}

async function updatePlayerStats(playerId: string, stats: {
  xpGained: number
  tradesExecuted: number
  volumeTraded: number
}) {
  // In a real implementation, update player stats in database
  // This would track cumulative XP, trade count, volume, etc.
  console.log(`Player ${playerId} gained ${stats.xpGained} XP`)
}

function checkAchievements(playerId: string, tradeData: any): string[] {
  const achievements = []
  
  // First trade achievement
  if (tradeData.tradeAmount > 0) {
    achievements.push('first_trade')
  }
  
  // Big trade achievement
  if (tradeData.tradeAmount > 5000) {
    achievements.push('whale_trade')
  }
  
  // YOLO achievement for high-risk trades
  if (tradeData.symbol === 'TSLA' && tradeData.tradeAmount > 2000) {
    achievements.push('yolo_trader')
  }
  
  return achievements
}

function checkLevelUp(xpGained: number): boolean {
  // Simple level up check - in reality this would check current XP vs level thresholds
  return xpGained > 500
}

function generateTradeFeedEntry(playerId: string, tradeData: any) {
  const impact = tradeData.impact
  const emoji = tradeData.side === 'buy' ? '🚀' : '📉'
  const impactText = impact > 0.05 ? 'MASSIVE' : impact > 0.02 ? 'BIG' : 'SOLID'
  
  return {
    id: `feed-${Date.now()}`,
    playerId,
    type: 'trade',
    message: `${emoji} ${impactText} ${tradeData.side.toUpperCase()} on ${tradeData.symbol}! ${tradeData.shares} shares @ $${tradeData.price.toFixed(2)}`,
    timestamp: new Date().toISOString(),
    impact: impact
  }
}

function calculateMarketImpact(tradeAmount: number, symbol: string): number {
  // Calculate how much this trade affects the stock price
  // Larger trades have more impact
  const baseImpact = tradeAmount / 100000 // $100k trade = 1% impact
  const volatilityMultiplier = symbol === 'TSLA' ? 2 : symbol === 'NVDA' ? 1.5 : 1
  
  return Math.min(baseImpact * volatilityMultiplier, 0.1) // Cap at 10% impact
}