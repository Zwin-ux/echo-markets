import { NextRequest, NextResponse } from 'next/server'
import SessionManager from '@/lib/session-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    const limitNumber = limit ? parseInt(limit) : 30

    // Get historical performance
    const history = await SessionManager.getHistoricalPerformance(userId, limitNumber)

    return NextResponse.json({
      success: true,
      data: {
        userId: history.userId,
        totalSessions: history.totalSessions,
        winRate: history.winRate,
        averageReturn: history.averageReturn,
        currentStreak: history.currentStreak,
        longestWinStreak: history.longestWinStreak,
        bestSession: {
          sessionDate: history.bestSession.sessionDate,
          returnPercent: history.bestSession.returnPercent,
          totalReturn: history.bestSession.totalReturn,
          tradesCount: history.bestSession.tradesCount
        },
        worstSession: {
          sessionDate: history.worstSession.sessionDate,
          returnPercent: history.worstSession.returnPercent,
          totalReturn: history.worstSession.totalReturn,
          tradesCount: history.worstSession.tradesCount
        },
        sessions: history.sessions.map(session => ({
          sessionDate: session.sessionDate,
          startingCash: session.startingCash,
          endingValue: session.endingValue,
          totalReturn: session.totalReturn,
          returnPercent: session.returnPercent,
          tradesCount: session.tradesCount,
          positionCount: session.positions.length,
          rank: session.rank
        }))
      }
    })

  } catch (error) {
    console.error('Historical performance error:', error)
    return NextResponse.json(
      { error: 'Failed to get historical performance' },
      { status: 500 }
    )
  }
}