import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSessionToken, getSessionExpiry } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email } = await request.json()
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
    
    if (!session.user.is_guest) {
      return NextResponse.json(
        { message: 'User is not a guest account' },
        { status: 400 }
      )
    }
    
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
    
    // Check if username already exists (excluding current user)
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser && existingUser.id !== session.user.id) {
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
      
      if (existingEmail && existingEmail.id !== session.user.id) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 409 }
        )
      }
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 12)
    
    // Generate new session token
    const new_session_token = generateSessionToken()
    const expires_at = getSessionExpiry()
    
    // Update user to permanent account
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username,
        password_hash,
        email: email || null,
        is_guest: false,
        display_name: username,
        last_active: new Date()
      }
    })
    
    // Invalidate old session and create new one
    await prisma.userSession.delete({
      where: { id: session.id }
    })
    
    await prisma.userSession.create({
      data: {
        user_id: updatedUser.id,
        session_token: new_session_token,
        expires_at
      }
    })
    
    return NextResponse.json({
      user: {
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
      },
      session_token: new_session_token,
      expires_at
    })
  } catch (error) {
    console.error('[auth] Guest conversion failed:', error)
    return NextResponse.json(
      { message: 'Conversion failed' },
      { status: 500 }
    )
  }
}