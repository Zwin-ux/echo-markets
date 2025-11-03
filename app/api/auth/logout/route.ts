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
    
    // Delete the session
    await prisma.userSession.deleteMany({
      where: { session_token }
    })
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[auth] Logout failed:', error)
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    )
  }
}