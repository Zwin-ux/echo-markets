/**
 * Market State API
 * Provides comprehensive market state information including prices, events, and drama score
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEngine } from '@/lib/market-engine'
import { marketEventSystem } from '@/lib/market-events'
import EnhancedDatabaseService from '@/lib/enhanced-db'
import { SymbolTicker } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')?.split(',') || undefined
    
    // Get market state from engine
    const marketState = marketEngine.getMarketState()
    
    // Get latest market data
    const marketData = await EnhancedDatabaseService.getLatestMarketData(symbols)
    
    // Get active events
    const activeEvents = marketEventSystem.getActiveEvents()
    
    // Calculate combined drama score
    const eventDramaScore = marketEventSystem.calculateDramaScore()
    const combinedDramaScore = (eventDramaScore * 0.6) + (marketState.dramaScore * 0.4)
    
    // Format market data for response
    const formattedMarketData = marketData.map((tick: any) => ({
      symbol: tick.symbol,
      price: tick.price,
      bid: tick.bid,
      ask: tick.ask,
      change: tick.change_24h,
      changePercent: tick.change_percent_24h,
      volume: tick.volume,
      volatility: tick.volatility,
      timestamp: tick.timestamp
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        marketState: {
          isOpen: marketState.isOpen,
          dramaScore: Math.round(combinedDramaScore),
          volatilityRegime: marketState.volatilityRegime,
          marketTrend: marketState.marketTrend
        },
        prices: formattedMarketData,
        events: {
          active: activeEvents,
          count: activeEvents.length
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Market state API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market state' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, symbols } = body
    
    switch (action) {
      case 'generate_prices':
        // Generate new price updates for specified symbols or all symbols
        const updates = symbols 
          ? await Promise.all(symbols.map((symbol: string) => marketEngine.generatePriceUpdate(symbol as SymbolTicker)))
          : await marketEngine.generateAllPriceUpdates()
        
        return NextResponse.json({
          success: true,
          data: { updates }
        })
        
      case 'trigger_event':
        // Trigger a random market event
        const event = await marketEventSystem.generateRandomEvent()
        
        return NextResponse.json({
          success: true,
          data: { event }
        })
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action' 
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Market state action error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute market action' 
      },
      { status: 500 }
    )
  }
}