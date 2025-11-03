import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-server'
import { getStartingCash } from '@/lib/config'

export const dynamic = 'force-dynamic'

interface ResetRequest {
  user_id: string
  reset_holdings?: boolean
}

function unauthorized(msg = 'unauthorized') {
  return NextResponse.json({ error: msg }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token') || ''
  const expected = process.env.ADMIN_RESET_TOKEN || ''
  if (!expected || token !== expected) return unauthorized()

  const body = (await req.json()) as ResetRequest
  const userId = body?.user_id
  if (!userId) return NextResponse.json({ error: 'user_id_required' }, { status: 400 })

  const sb = getSupabaseService()
  const start = getStartingCash()

  // Fetch portfolio
  const { data: port, error: portErr } = await sb
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (portErr) return NextResponse.json({ error: portErr.message }, { status: 500 })
  if (!port) return NextResponse.json({ error: 'portfolio_not_found' }, { status: 404 })

  // Reset cash
  const { error: cashErr } = await sb
    .from('portfolios')
    .update({ cash: start })
    .eq('id', port.id)
  if (cashErr) return NextResponse.json({ error: cashErr.message }, { status: 500 })

  // Reset lightweight quest stats
  const { data: prof, error: profErr } = await sb
    .from('profiles')
    .select('stats')
    .eq('user_id', userId)
    .maybeSingle()
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
  const stats = prof?.stats || {}
  const day = new Date().toISOString().slice(0, 10)
  const newStats = {
    ...stats,
    trades_today: 0,
    profitable_sells_today: 0,
    quest: { day, goal_pnl: 10, progress_pnl: 0, done: false },
  }
  const { error: statsErr } = await sb
    .from('profiles')
    .update({ stats: newStats })
    .eq('user_id', userId)
  if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 })

  // Optional: clear holdings and open orders (testing convenience)
  if (body.reset_holdings) {
    await sb.from('holdings').delete().eq('portfolio_id', port.id)
    await sb.from('orders').delete().eq('user_id', userId).eq('status', 'open')
  }

  return NextResponse.json({ ok: true, user_id: userId, starting_cash: start })
}

