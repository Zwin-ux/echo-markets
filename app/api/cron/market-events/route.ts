/**
 * Market Events Cron Job
 * Generates random market events every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEventSystem } from '@/lib/market-events'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up expired events
    marketEventSystem.cleanupExpiredEvents()

    // Try to generate a random event
    const event = await marketEventSystem.generateRandomEvent()
    
    // Get current drama score
    const dramaScore = marketEventSystem.calculateDramaScore()
    const activeEvents = marketEventSystem.getActiveEvents()

    if (event) {
      return NextResponse.json({
        success: true,
        message: 'Generated new market event',
        event: {
          type: event.type,
          title: event.title,
          affectedSymbols: event.affectedSymbols,
          sentiment: event.sentiment,
          magnitude: event.magnitude
        },
        dramaScore,
        activeEventsCount: activeEvents.length,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No event generated this cycle',
        dramaScore,
        activeEventsCount: activeEvents.length,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Market events cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process market events',
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