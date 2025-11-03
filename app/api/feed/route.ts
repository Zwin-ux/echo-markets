import { NextRequest, NextResponse } from 'next/server'
// Removed deprecated supabase import

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200)
    const sb = getSupabaseService()

    // Load recent trades and events
    const [tradesRes, eventsRes] = await Promise.all([
      sb.from('trades').select('id, symbol, price, qty, buy_user, sell_user, executed_at').order('executed_at', { ascending: false }).limit(limit),
      sb.from('events').select('id, symbol, headline, impact_type, magnitude, created_at').order('created_at', { ascending: false }).limit(limit),
    ])
    if (tradesRes.error) throw tradesRes.error
    if (eventsRes.error) throw eventsRes.error

    const trades = tradesRes.data ?? []
    const events = eventsRes.data ?? []

    // Resolve usernames for distinct user IDs (service role bypasses RLS on profiles)
    const userIds = new Set<string>()
    trades.forEach((t: any) => { if (t.buy_user) userIds.add(t.buy_user); if (t.sell_user) userIds.add(t.sell_user) })
    const users = Array.from(userIds)
    let nameMap = new Map<string, string>()
    if (users.length) {
      const { data } = await sb.from('profiles').select('user_id, username').in('user_id', users)
      nameMap = new Map((data ?? []).map((r: any) => [r.user_id, r.username || r.user_id]))
    }

    const tradeItems = trades.map((t: any) => ({
      type: 'trade' as const,
      id: t.id,
      ts: t.executed_at,
      symbol: t.symbol,
      price: Number(t.price),
      qty: Number(t.qty),
      buy_username: t.buy_user ? (nameMap.get(t.buy_user) || t.buy_user) : null,
      sell_username: t.sell_user ? (nameMap.get(t.sell_user) || t.sell_user) : null,
    }))

    const eventItems = events.map((e: any) => ({
      type: 'event' as const,
      id: e.id,
      ts: e.created_at,
      symbol: e.symbol,
      headline: e.headline,
      impact_type: e.impact_type,
      magnitude: Number(e.magnitude) || 0,
    }))

    const merged = [...tradeItems, ...eventItems].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, limit)
    return NextResponse.json({ items: merged })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

