import { NextRequest, NextResponse } from 'next/server'
import SessionManager from '@/lib/session-manager'

export async function GET(request: NextRequest) {
  try {
    // Get current trading session
    const session = await SessionManager.getCurrentSession()

    if (!session) {
      return NextResponse.json(
        { error: 'No active trading session found' },
        { status: 404 }
      )
    }

    // Check if trading is currently active
    const isTradingActive = await SessionManager.isTradingActive()

    // Get session statistics
    const statistics = await SessionManager.getSessionStatistics(session.date)

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          participantCount: session.participantCount,
          totalVolume: session.totalVolume,
          topPerformer: session.topPerformer
        },
        isTradingActive,
        statistics: {
          participantCount: statistics.participantCount,
          totalTrades: statistics.totalTrades,
          totalVolume: statistics.totalVolume,
          averageReturn: statistics.averageReturn,
          topPerformers: statistics.topPerformers
        }
      }
    })

  } catch (error) {
    console.error('Session retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to get current session' },
      { status: 500 }
    )
  }
}