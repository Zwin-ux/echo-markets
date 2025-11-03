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
      include: { user: true }
    })
    
    if (!session || session.expires_at < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    // Update last active
    await prisma.user.update({
      where: { id: session.user.id },
      data: { last_active: new Date() }
    })
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        display_name: session.user.display_name,
        email: session.user.email,
        avatar_url: session.user.avatar_url,
        bio: session.user.bio,
        is_guest: session.user.is_guest,
        profile_public: session.user.profile_public,
        trades_public: session.user.trades_public,
        allow_copy_trading: session.user.allow_copy_trading,
        followers_count: session.user.followers_count,
        following_count: session.user.following_count,
        total_score: session.user.total_score,
        rank_tier: session.user.rank_tier,
        created_at: session.user.created_at,
        last_active: session.user.last_active
      },
      session_token: session.session_token,
      expires_at: session.expires_at
    })
  } catch (error) {
    console.error('[auth] Session validation failed:', error)
    return NextResponse.json(
      { message: 'Session validation failed' },
      { status: 500 }
    )
  }
}