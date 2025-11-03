import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSessionToken, getSessionExpiry } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    })
    
    if (!user || user.is_guest || !user.password_hash) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    // Generate new session
    const session_token = generateSessionToken()
    const expires_at = getSessionExpiry()
    
    // Create session in database
    await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_token,
        expires_at
      }
    })
    
    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { last_active: new Date() }
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
    console.error('[auth] Login failed:', error)
    return NextResponse.json(
      { message: 'Login failed' },
      { status: 500 }
    )
  }
}