/**
 * MMO Leaderboard API
 * Returns database rankings when available and a quiet demo board for public builds without DB access.
 */

import { NextRequest, NextResponse } from 'next/server'
import EnhancedDatabaseService from '@/lib/enhanced-db'
import { createDemoLeaderboard } from '@/lib/demo-responses'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'total_value'
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  try {
    const leaderboard = await EnhancedDatabaseService.getLeaderboard(category, undefined, limit)
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      id: entry.user_id,
      rank: index + 1,
      playerId: entry.user_id,
      username: entry.user?.username || entry.user?.name || 'Anonymous',
      score: entry.score,
      totalValue: entry.score,
      level: Math.floor(entry.score / 5000) + 1,
      xp: Math.max(0, entry.score - 10000),
      dayChange: entry.score - 10000,
      change: entry.score - 10000,
      badge: getRankBadge(index + 1),
      isOnline: index < 8,
      achievements: [],
      streak: Math.max(1, 10 - index)
    }))

    const visibleLeaderboard = formattedLeaderboard.length
      ? formattedLeaderboard
      : createDemoLeaderboard(limit)

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: visibleLeaderboard,
        stats: buildStats(visibleLeaderboard),
        lastUpdated: new Date().toISOString(),
        demoMode: formattedLeaderboard.length === 0
      }
    })
  } catch (error) {
    console.warn('Leaderboard API fell back to demo mode:', error)
    const leaderboard = createDemoLeaderboard(limit)

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        stats: buildStats(leaderboard),
        lastUpdated: new Date().toISOString(),
        demoMode: true
      }
    })
  }
}

function buildStats(leaderboard: ReturnType<typeof createDemoLeaderboard>) {
  return {
    totalPlayers: leaderboard.length,
    averageScore: leaderboard.reduce((sum, player) => sum + player.score, 0) / leaderboard.length,
    topGainer: leaderboard.reduce((max, player) => player.change > max.change ? player : max, leaderboard[0]),
    mostActive: leaderboard[1] || leaderboard[0]
  }
}

function getRankBadge(rank: number): string {
  if (rank === 1) return 'top-signal'
  if (rank === 2) return 'runner-up'
  if (rank === 3) return 'third-signal'
  if (rank <= 10) return 'hot-hand'
  if (rank <= 50) return 'live-wire'
  return 'observer'
}
