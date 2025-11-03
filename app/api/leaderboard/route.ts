import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export interface LeaderboardRow { user_id: string; username: string | null; pnl: number; win_rate: number }
export interface LeaderboardResponse { day: string; players: LeaderboardRow[] }

async function computeWinRate(userId: string): Promise<number> {
  // Simplified win rate calculation based on profitable trades
  const sellTrades = await prisma.trade.findMany({
    where: { seller_id: userId },
    orderBy: { timestamp: 'desc' },
    take: 100
  })
  
  let wins = 0, total = 0
  for (const sell of sellTrades) {
    const lastBuy = await prisma.trade.findFirst({
      where: {
        buyer_id: userId,
        symbol: sell.symbol,
        timestamp: { lt: sell.timestamp }
      },
      orderBy: { timestamp: 'desc' }
    })
    
    if (lastBuy) {
      total += 1
      if (sell.price > lastBuy.price) wins += 1
    }
  }
  
  if (total === 0) return 0
  return Math.round((wins / total) * 10000) / 100 // percentage with 2 decimals
}

export async function GET(req: NextRequest) {
  try {
    const urlObj = new URL(req.url)
    const limit = Math.min(Number(urlObj.searchParams.get('limit') || 20), 50)
    const day = urlObj.searchParams.get('day') || new Date().toISOString().slice(0, 10)

    // For now, calculate leaderboard based on current portfolio values
    // TODO: Implement proper daily PnL tracking
    const users = await prisma.user.findMany({
      include: {
        holdings: true
      },
      take: limit
    })

    const players: LeaderboardRow[] = []
    for (const user of users) {
      // Calculate portfolio value (simplified)
      const holdingsValue = user.holdings.reduce((sum, holding) => {
        return sum + (holding.qty * holding.avg_cost)
      }, 0)
      
      const totalValue = user.cash + holdingsValue
      const pnl = totalValue - 10000 // Assuming starting cash of 10000
      const win_rate = await computeWinRate(user.id)
      
      players.push({ 
        user_id: user.id, 
        username: user.name, 
        pnl, 
        win_rate 
      })
    }

    // Sort by PnL descending
    players.sort((a, b) => b.pnl - a.pnl)
    
    return NextResponse.json<LeaderboardResponse>({ day, players })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'server_error' }, { status: 500 })
  }
}
