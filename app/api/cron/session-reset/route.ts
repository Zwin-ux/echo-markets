/**
 * Session Reset Cron Job
 * Resets daily trading sessions at market open (9 AM ET, weekdays)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PortfolioSimulator } from '@/lib/portfolio-simulator'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if it's a weekday (Monday = 1, Friday = 5)
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({
        success: true,
        message: 'Weekend - no session reset needed',
        timestamp: new Date().toISOString()
      })
    }

    // Reset daily sessions
    const simulator = new PortfolioSimulator()
    const resetCount = await simulator.resetDailySessions()

    return NextResponse.json({
      success: true,
      message: `Reset ${resetCount} daily trading sessions`,
      resetCount,
      sessionDate: today.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Session reset cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset daily sessions',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}