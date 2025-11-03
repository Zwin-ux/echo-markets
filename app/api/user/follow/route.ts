import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const session_token = authHeader.substring(7)
    const { userId, action } = await request.json()
    
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
    
    if (!userId || !action) {
      return NextResponse.json(
        { message: 'User ID and action are required' },
        { status: 400 }
      )
    }
    
    if (session.user.id === userId) {
      return NextResponse.json(
        { message: 'Cannot follow yourself' },
        { status: 400 }
      )
    }
    
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    if (action === 'follow') {
      // Create follow relationship
      await prisma.userFollow.upsert({
        where: {
          follower_id_following_id: {
            follower_id: session.user.id,
            following_id: userId
          }
        },
        update: {
          notifications_enabled: true
        },
        create: {
          follower_id: session.user.id,
          following_id: userId,
          notifications_enabled: true
        }
      })
      
      // Update follower counts
      await prisma.user.update({
        where: { id: session.user.id },
        data: { following_count: { increment: 1 } }
      })
      
      await prisma.user.update({
        where: { id: userId },
        data: { followers_count: { increment: 1 } }
      })
      
      return NextResponse.json({ message: 'Successfully followed user' })
      
    } else if (action === 'unfollow') {
      // Remove follow relationship
      const deleted = await prisma.userFollow.deleteMany({
        where: {
          follower_id: session.user.id,
          following_id: userId
        }
      })
      
      if (deleted.count > 0) {
        // Update follower counts
        await prisma.user.update({
          where: { id: session.user.id },
          data: { following_count: { decrement: 1 } }
        })
        
        await prisma.user.update({
          where: { id: userId },
          data: { followers_count: { decrement: 1 } }
        })
      }
      
      return NextResponse.json({ message: 'Successfully unfollowed user' })
      
    } else {
      return NextResponse.json(
        { message: 'Invalid action. Use "follow" or "unfollow"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[follow] Failed to update follow status:', error)
    return NextResponse.json(
      { message: 'Failed to update follow status' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'followers' or 'following'
    
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
    
    const targetUserId = userId || session.user.id
    
    if (type === 'followers') {
      const followers = await prisma.userFollow.findMany({
        where: { following_id: targetUserId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              total_score: true,
              rank_tier: true,
              last_active: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
      
      return NextResponse.json({
        followers: followers.map(f => f.follower)
      })
      
    } else if (type === 'following') {
      const following = await prisma.userFollow.findMany({
        where: { follower_id: targetUserId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              total_score: true,
              rank_tier: true,
              last_active: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
      
      return NextResponse.json({
        following: following.map(f => f.following)
      })
      
    } else {
      return NextResponse.json(
        { message: 'Invalid type. Use "followers" or "following"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[follow] Failed to get follow list:', error)
    return NextResponse.json(
      { message: 'Failed to get follow list' },
      { status: 500 }
    )
  }
}