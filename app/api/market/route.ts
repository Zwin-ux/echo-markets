import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export interface MarketItem {
  symbol: string
  current_price: number
  ts: string
}

export interface MarketResponse {
  tickers: MarketItem[]
}

export async function GET() {
  try {
    // Fetch recent ticks and reduce to latest per symbol
    const ticks = await prisma.tick.findMany({
      orderBy: { timestamp: 'desc' },
      take: 500
    })

    const latest = new Map<string, MarketItem>()
    for (const tick of ticks) {
      const sym = tick.symbol
      if (!latest.has(sym)) {
        latest.set(sym, { 
          symbol: sym, 
          current_price: tick.price, 
          ts: tick.timestamp.toISOString() 
        })
      }
    }

    const tickers = Array.from(latest.values())
    return NextResponse.json<MarketResponse>({ tickers })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'server_error' }, { status: 500 })
  }
}

