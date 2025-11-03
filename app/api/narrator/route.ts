import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100)
    
    const narratives = await prisma.narrative.findMany({
      select: {
        id: true,
        content: true,
        timestamp: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
    
    // Map to match expected format
    const formattedNarratives = narratives.map(n => ({
      id: n.id,
      text: n.content,
      created_at: n.timestamp.toISOString()
    }))
    
    return NextResponse.json({ narratives: formattedNarratives })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

