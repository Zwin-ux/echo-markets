/**
 * Market Ticker Cron Job
 * Generates price updates every 2 minutes during market hours
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEngine } from '@/lib/market-engine'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get market state
    const marketState = marketEngine.getMarketState()
    
    // Only generate updates during market hours or for demo purposes
    if (!marketState.isOpen && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        message: 'Market closed, skipping price updates',
        timestamp: new Date().toISOString()
      })
    }

    // Generate price updates for all symbols
    const updates = await marketEngine.generateAllPriceUpdates()
    
    return NextResponse.json({
      success: true,
      message: `Generated ${updates.length} price updates`,
      updates: updates.map(u => ({
        symbol: u.symbol,
        price: u.price,
        change: u.changePercent
      })),
      marketState: {
        isOpen: marketState.isOpen,
        dramaScore: marketState.dramaScore,
        volatilityRegime: marketState.volatilityRegime
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Market ticker cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate price updates',
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