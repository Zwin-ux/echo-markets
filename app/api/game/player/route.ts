/**
 * Player Management API
 * Handles player profiles, stats, and progression
 */

import { NextRequest, NextResponse } from 'next/server'
import EnhancedDatabaseService from '@/lib/enhanced-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('id')
    
    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID required' },
        { status: 400 }
      )
    }

    // Get player data from database
    const user = await EnhancedDatabaseService.getUserById(playerId)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      )
    }

    // Calculate player stats
    const portfolio = await EnhancedDatabaseService.getCurrentPortfolio(playerId)
    const totalValue = portfolio?.total_value || 10000
    const dayChange = portfolio?.day_change || 0
    
    // Get player rank from leaderboard
    const leaderboard = await EnhancedDatabaseService.getLeaderboard('total_value')
    const rank = leaderboard.findIndex(entry => entry.user_id === playerId) + 1

    const playerData = {
      id: user.id,
      username: user.username || user.name || 'Anonymous',
      level: Math.floor(totalValue / 5000) + 1, // Level up every $5k
      xp: Math.floor(totalValue - 10000), // XP based on profit
      totalValue,
      dayChange,
      rank: rank || 999,
      achievements: [], // TODO: Implement achievements
      streak: 0, // TODO: Implement streak tracking
      joinedAt: user.created_at
    }

    return NextResponse.json({
      success: true,
      data: playerData
    })
  } catch (error) {
    console.error('Player API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email } = body

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username required' },
        { status: 400 }
      )
    }

    // Create new player
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // This would typically integrate with your auth system
    // For demo purposes, we'll create a simple user record
    const userData = {
      id: playerId,
      username,
      email: email || `${username}@demo.com`,
      cash: 10000,
      created_at: new Date(),
      updated_at: new Date(),
      last_active: new Date(),
      preferences: {}
    }

    // In a real implementation, you'd use Prisma to create the user
    // await prisma.user.create({ data: userData })

    return NextResponse.json({
      success: true,
      data: {
        id: playerId,
        username,
        level: 1,
        xp: 0,
        totalValue: 10000,
        dayChange: 0,
        rank: 999,
        achievements: [],
        streak: 0
      }
    })
  } catch (error) {
    console.error('Player creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create player' },
      { status: 500 }
    )
  }
}