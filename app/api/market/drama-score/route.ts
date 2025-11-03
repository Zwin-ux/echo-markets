/**
 * Drama Score API
 * Provides real-time market drama score calculation
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEventSystem } from '@/lib/market-events'
import { marketEngine } from '@/lib/market-engine'

export async function GET(request: NextRequest) {
  try {
    // Get drama score from both event system and market engine
    const eventDramaScore = marketEventSystem.calculateDramaScore()
    const marketState = marketEngine.getMarketState()
    
    // Combine scores (weighted average)
    const combinedScore = (eventDramaScore * 0.6) + (marketState.dramaScore * 0.4)
    
    return NextResponse.json({
      success: true,
      data: {
        dramaScore: Math.round(combinedScore),
        eventScore: Math.round(eventDramaScore),
        marketScore: Math.round(marketState.dramaScore),
        volatilityRegime: marketState.volatilityRegime,
        marketTrend: marketState.marketTrend,
        activeEvents: marketState.activeEvents.length,
        isMarketOpen: marketState.isOpen
      }
    })
  } catch (error) {
    console.error('Drama score API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate drama score' 
      },
      { status: 500 }
    )
  }
}