import { NextRequest, NextResponse } from 'next/server'
// Removed deprecated supabase import

export interface PortfolioResponse {
  balance: number
  positions: Array<{
    symbol: string
    shares: number
    avg_cost: number
    current_price: number
    unrealized_pnl: number
  }>
  portfolio_id?: string
}

async function getLatestPrice(sb: any, symbol: string): Promise<number> {
  const { data, error } = await sb
    .from('ticks')
    .select('price')
    .eq('symbol', symbol)
    .order('ts', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return 0
  return Number(data?.price) || 0
}

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseForRequest(req)
    const { data: userResult } = await sb.auth.getUser()
    if (!userResult?.user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    // Fetch cash from v_user_portfolio view
    const { data: portRows, error: portErr } = await sb.from('v_user_portfolio').select('*').limit(1)
    if (portErr) throw portErr
    const cash = Number(portRows?.[0]?.cash) || 0
    const portfolio_id = portRows?.[0]?.portfolio_id as string | undefined

    // Fetch holdings
    const { data: holdings, error: holdErr } = await sb.from('holdings').select('symbol, shares, avg_price')
    if (holdErr) throw holdErr

    const positions = [] as PortfolioResponse['positions']
    for (const h of holdings || []) {
      const symbol = String(h.symbol)
      const shares = Number(h.shares) || 0
      const avg = Number(h.avg_price) || 0
      const price = await getLatestPrice(sb, symbol)
      const pnl = (price - avg) * shares
      positions.push({ symbol, shares, avg_cost: avg, current_price: price, unrealized_pnl: Math.round(pnl * 100) / 100 })
    }

    const res: PortfolioResponse = { balance: Math.round(cash * 100) / 100, positions, portfolio_id }
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'server_error' }, { status: 500 })
  }
}
