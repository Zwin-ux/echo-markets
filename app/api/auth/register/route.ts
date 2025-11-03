import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRandomAvatar, generateSessionToken, getSessionExpiry } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email } = await request.json()
    
    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { message: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 409 }
      )
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingEmail) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 409 }
        )
      }
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 12)
    
    // Generate session data
    const avatar_url = generateRandomAvatar()
    const session_token = generateSessionToken()
    const expires_at = getSessionExpiry()
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        username,
        password_hash,
        email: email || null,
        avatar_url,
        is_guest: false,
        display_name: username,
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
    console.error('[auth] Registration failed:', error)
    return NextResponse.json(
      { message: 'Registration failed' },
      { status: 500 }
    )
  }
}