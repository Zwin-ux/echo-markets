import { NextRequest, NextResponse } from 'next/server'
// Removed deprecated supabase import
import { defaultQuest, todayStr } from '@/lib/progression'

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseForRequest(req)
    const { data: userRes } = await sb.auth.getUser()
    if (!userRes?.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    const { data: prof, error } = await sb.from('profiles').select('stats').limit(1).maybeSingle()
    if (error) throw error
    const stats = (prof?.stats as any) || {}
    const day = todayStr()
    const quest = stats.quest && stats.quest.day === day ? stats.quest : defaultQuest()
    return NextResponse.json({ quest })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

