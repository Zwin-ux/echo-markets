import { NextRequest, NextResponse } from 'next/server'
import SessionManager from '@/lib/session-manager'

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected and only called by admin/system
    // In production, you'd want proper authentication and authorization
    
    const body = await request.json()
    const { adminKey } = body

    // Simple admin key check (in production, use proper auth)
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize daily reset
    await SessionManager.initializeDailyReset()

    return NextResponse.json({
      success: true,
      message: 'Daily portfolio reset completed successfully',
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Daily reset error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize daily reset' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if reset is needed
export async function GET(request: NextRequest) {
  try {
    const session = await SessionManager.getCurrentSession()
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const needsReset = !session || session.date.getTime() !== today.getTime()

    return NextResponse.json({
      success: true,
      data: {
        needsReset,
        currentSession: session ? {
          id: session.id,
          date: session.date,
          status: session.status
        } : null,
        serverTime: now
      }
    })

  } catch (error) {
    console.error('Reset check error:', error)
    return NextResponse.json(
      { error: 'Failed to check reset status' },
      { status: 500 }
    )
  }
}