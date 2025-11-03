import { NextRequest, NextResponse } from 'next/server'
import { portfolioSimulator } from '@/lib/portfolio-simulator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionDate = searchParams.get('sessionDate')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Parse session date if provided
    const date = sessionDate ? new Date(sessionDate) : undefined

    // Calculate portfolio value
    const portfolioValue = await portfolioSimulator.calculatePortfolioValue(userId, date)

    return NextResponse.json({
      success: true,
      data: {
        userId: portfolioValue.userId,
        sessionDate: portfolioValue.sessionDate,
        totalValue: portfolioValue.totalValue,
        cashBalance: portfolioValue.cashBalance,
        holdingsValue: portfolioValue.holdingsValue,
        dayChange: portfolioValue.dayChange,
        dayChangePercent: portfolioValue.dayChangePercent,
        startingCash: portfolioValue.startingCash,
        positions: portfolioValue.positions.map(position => ({
          symbol: position.symbol,
          quantity: position.quantity,
          averageCost: position.averageCost,
          currentPrice: position.currentPrice,
          marketValue: position.marketValue,
          unrealizedPnL: position.unrealizedPnL,
          unrealizedPnLPercent: position.unrealizedPnLPercent
        }))
      }
    })

  } catch (error) {
    console.error('Portfolio valuation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio value' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, sessionDate } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    // Parse session date if provided
    const date = sessionDate ? new Date(sessionDate) : undefined

    // Calculate portfolio values for multiple users
    const portfolioValues = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          return await portfolioSimulator.calculatePortfolioValue(userId, date)
        } catch (error) {
          console.error(`Failed to calculate portfolio for user ${userId}:`, error)
          return null
        }
      })
    )

    // Filter out failed calculations
    const validPortfolios = portfolioValues.filter(portfolio => portfolio !== null)

    return NextResponse.json({
      success: true,
      data: validPortfolios.map(portfolio => ({
        userId: portfolio!.userId,
        sessionDate: portfolio!.sessionDate,
        totalValue: portfolio!.totalValue,
        cashBalance: portfolio!.cashBalance,
        holdingsValue: portfolio!.holdingsValue,
        dayChange: portfolio!.dayChange,
        dayChangePercent: portfolio!.dayChangePercent,
        startingCash: portfolio!.startingCash,
        positionCount: portfolio!.positions.length
      }))
    })

  } catch (error) {
    console.error('Batch portfolio valuation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio values' },
      { status: 500 }
    )
  }
}