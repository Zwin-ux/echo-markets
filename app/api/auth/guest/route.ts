import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRandomAvatar, generateGuestUsername, generateSessionToken, getSessionExpiry } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Generate guest user data
    const username = generateGuestUsername()
    const avatar_url = generateRandomAvatar()
    const session_token = generateSessionToken()
    const expires_at = getSessionExpiry()
    
    // Create guest user in database
    const user = await prisma.user.create({
      data: {
        username,
        avatar_url,
        is_guest: true,
        display_name: username.replace(/_/g, ' '),
        sessions: {
          create: {
            session_token,
            expires_at
          }
        }
      }
    })
    
    // Initialize portfolio for the new user
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.portfolio.create({
      data: {
        user_id: user.id,
        session_date: today,
        starting_cash: 10000,
        current_cash: 10000,
        total_value: 10000,
        day_change: 0,
        day_change_percent: 0
      }
    })
    
    return NextResponse.json({
      user: {
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
        followers_count: user.followers_count,
        following_count: user.following_count,
        total_score: user.total_score,
        rank_tier: user.rank_tier,
        created_at: user.created_at,
        last_active: user.last_active
      },
      session_token,
      expires_at
    })
  } catch (error) {
    console.error('[auth] Guest creation failed:', error)
    return NextResponse.json(
      { message: 'Failed to create guest account' },
      { status: 500 }
    )
  }
}