import { NextRequest, NextResponse } from 'next/server'
import { portfolioSimulator } from '@/lib/portfolio-simulator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Get performance metrics
    const metrics = await portfolioSimulator.getPerformanceMetrics(userId)

    return NextResponse.json({
      success: true,
      data: {
        totalReturn: metrics.totalReturn,
        totalReturnPercent: metrics.totalReturnPercent,
        dayChange: metrics.dayChange,
        dayChangePercent: metrics.dayChangePercent,
        winRate: metrics.winRate,
        totalTrades: metrics.totalTrades,
        profitableTrades: metrics.profitableTrades,
        averageTradeReturn: metrics.averageTradeReturn,
        maxDrawdown: metrics.maxDrawdown,
        sharpeRatio: metrics.sharpeRatio,
        volatility: metrics.volatility
      }
    })

  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    )
  }
}