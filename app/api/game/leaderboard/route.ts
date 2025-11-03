/**
 * MMO Leaderboard API
 * Real-time rankings and competitive features
 */

import { NextRequest, NextResponse } from 'next/server'
import EnhancedDatabaseService from '@/lib/enhanced-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'total_value'
    const limit = parseInt(searchParams.get('limit') || '50')
    const timeframe = searchParams.get('timeframe') || 'daily'

    // Get leaderboard data
    const leaderboard = await EnhancedDatabaseService.getLeaderboard(category, undefined, limit)
    
    // Format for MMO-style display
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      playerId: entry.user_id,
      username: entry.user?.username || entry.user?.name || 'Anonymous',
      score: entry.score,
      level: Math.floor(entry.score / 5000) + 1,
      change: entry.score - 10000, // Profit/loss from starting amount
      badge: getRankBadge(index + 1),
      isOnline: Math.random() > 0.3 // Mock online status
    }))

    // Add some competitive stats
    const stats = {
      totalPlayers: formattedLeaderboard.length,
      averageScore: formattedLeaderboard.reduce((sum, p) => sum + p.score, 0) / formattedLeaderboard.length,
      topGainer: formattedLeaderboard.reduce((max, p) => p.change > max.change ? p : max, formattedLeaderboard[0]),
      mostActive: formattedLeaderboard[Math.floor(Math.random() * Math.min(10, formattedLeaderboard.length))]
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        stats,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '👑'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  if (rank <= 10) return '⭐'
  if (rank <= 50) return '🔥'
  return '💎'
}