import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            portfolios: true,
            trades_as_buyer: true,
            trades_as_seller: true
          }
        },
        portfolios: {
          orderBy: { session_date: 'desc' },
          take: 10,
          select: {
            session_date: true,
            total_value: true,
            day_change: true,
            day_change_percent: true
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if profile is public
    if (!user.profile_public) {
      return NextResponse.json(
        { message: 'Profile is private' },
        { status: 403 }
      )
    }
    
    // Calculate performance stats
    const recentPortfolios = user.portfolios
    const avgReturn = recentPortfolios.length > 0 
      ? recentPortfolios.reduce((sum, p) => sum + (p.day_change_percent || 0), 0) / recentPortfolios.length
      : 0
    
    const bestDay = recentPortfolios.length > 0
      ? Math.max(...recentPortfolios.map(p => p.day_change_percent || 0))
      : 0
    
    const worstDay = recentPortfolios.length > 0
      ? Math.min(...recentPortfolios.map(p => p.day_change_percent || 0))
      : 0
    
    return NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      is_guest: user.is_guest,
      followers_count: user._count.followers,
      following_count: user._count.following,
      total_score: user.total_score,
      rank_tier: user.rank_tier,
      created_at: user.created_at,
      last_active: user.last_active,
      stats: {
        portfolios_count: user._count.portfolios,
        total_trades: user._count.trades_as_buyer + user._count.trades_as_seller,
        avg_return: avgReturn,
        best_day: bestDay,
        worst_day: worstDay
      },
      recent_performance: recentPortfolios.map(p => ({
        date: p.session_date,
        value: p.total_value,
        change: p.day_change,
        change_percent: p.day_change_percent
      }))
    })
  } catch (error) {
    console.error('[profile] Failed to get user profile:', error)
    return NextResponse.json(
      { message: 'Failed to get user profile' },
      { status: 500 }
    )
  }
}