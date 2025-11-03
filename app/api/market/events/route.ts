/**
 * Market Events API
 * Provides access to market events and drama score
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEventSystem } from '@/lib/market-events'
import EnhancedDatabaseService from '@/lib/enhanced-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeActive = searchParams.get('active') === 'true'
    
    if (includeActive) {
      // Return only active events
      const activeEvents = marketEventSystem.getActiveEvents()
      const dramaScore = marketEventSystem.calculateDramaScore()
      
      return NextResponse.json({
        success: true,
        data: {
          events: activeEvents.slice(0, limit),
          dramaScore,
          activeCount: activeEvents.length
        }
      })
    } else {
      // Return recent events from database
      const events = await EnhancedDatabaseService.getRecentMarketEvents(limit)
      const dramaScore = marketEventSystem.calculateDramaScore()
      
      return NextResponse.json({
        success: true,
        data: {
          events,
          dramaScore,
          activeCount: marketEventSystem.getActiveEvents().length
        }
      })
    }
  } catch (error) {
    console.error('Market events API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market events' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, symbols } = body
    
    if (!eventType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event type is required' 
        },
        { status: 400 }
      )
    }
    
    // Trigger a specific event (for testing or admin purposes)
    const event = await marketEventSystem.triggerEvent(eventType, symbols)
    
    return NextResponse.json({
      success: true,
      data: { event }
    })
  } catch (error) {
    console.error('Market events trigger error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger market event' 
      },
      { status: 500 }
    )
  }
}