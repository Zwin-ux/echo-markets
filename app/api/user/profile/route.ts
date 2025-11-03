import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const session_token = authHeader.substring(7)
    
    // Find current session
    const session = await prisma.userSession.findUnique({
      where: { session_token },
      include: { 
        user: {
          include: {
            _count: {
              select: {
                followers: true,
                following: true,
                portfolios: true,
                trades_as_buyer: true,
                trades_as_seller: true
              }
            }
          }
        }
      }
    })
    
    if (!session || session.expires_at < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    const user = session.user
    
    return NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      is_guest: user.is_guest,
      profile_public: user.profile_public,
      trades_public: user.trades_public,
      allow_copy_trading: user.allow_copy_trading,
      followers_count: user._count.followers,
      following_count: user._count.following,
      total_score: user.total_score,
      rank_tier: user.rank_tier,
      created_at: user.created_at,
      last_active: user.last_active,
      stats: {
        portfolios_count: user._count.portfolios,
        total_trades: user._count.trades_as_buyer + user._count.trades_as_seller
      }
    })
  } catch (error) {
    console.error('[profile] Failed to get profile:', error)
    return NextResponse.json(
      { message: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const session_token = authHeader.substring(7)
    const updates = await request.json()
    
    // Find current session
    const session = await prisma.userSession.findUnique({
      where: { session_token },
      include: { user: true }
    })
    
    if (!session || session.expires_at < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    // Validate allowed fields
    const allowedFields = [
      'display_name', 'bio', 'avatar_url', 'profile_public', 
      'trades_public', 'allow_copy_trading'
    ]
    
    const filteredUpdates: any = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...filteredUpdates,
        last_active: new Date()
      }
    })
    
    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      display_name: updatedUser.display_name,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar_url,
      bio: updatedUser.bio,
      is_guest: updatedUser.is_guest,
      profile_public: updatedUser.profile_public,
      trades_public: updatedUser.trades_public,
      allow_copy_trading: updatedUser.allow_copy_trading,
      followers_count: updatedUser.followers_count,
      following_count: updatedUser.following_count,
      total_score: updatedUser.total_score,
      rank_tier: updatedUser.rank_tier,
      created_at: updatedUser.created_at,
      last_active: updatedUser.last_active
    })
  } catch (error) {
    console.error('[profile] Failed to update profile:', error)
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    )
  }
}