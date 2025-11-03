import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase-server'

type OrderSide = 'buy' | 'sell'
type OrderType = 'market' | 'limit'

export interface TradeRequestBody {
  symbol: string
  side: 'BUY' | 'SELL' | 'buy' | 'sell'
  type: 'MARKET' | 'LIMIT' | 'market' | 'limit'
  qty: number
  limit_price?: number
}

export interface TradeResponseBody {
  success: boolean
  order_id?: string
  error?: string
}

const lastTradeAt = new Map<string, number>()

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabaseForRequest(req)
    const { data: userResult } = await sb.auth.getUser()
    if (!userResult?.user) {
      return NextResponse.json<TradeResponseBody>({ success: false, error: 'unauthenticated' }, { status: 401 })
    }

    const body = (await req.json()) as TradeRequestBody
    const symbol = (body.symbol || '').trim().toUpperCase()
    const side = (body.side || '').toString().toLowerCase() as OrderSide
    const type = (body.type || '').toString().toLowerCase() as OrderType
    const qty = Number(body.qty)
    const limitPrice = body.limit_price != null ? Number(body.limit_price) : null

    if (!symbol || (side !== 'buy' && side !== 'sell') || (type !== 'market' && type !== 'limit') || !Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json<TradeResponseBody>({ success: false, error: 'invalid_input' }, { status: 400 })
    }

    // Basic rate limit per user: 1 trade per 500ms (MVP)
    const userId = userResult.user.id
    const now = Date.now()
    const last = lastTradeAt.get(userId) || 0
    if (now - last < 500) {
      return NextResponse.json<TradeResponseBody>({ success: false, error: 'rate_limited' }, { status: 429 })
    }
    lastTradeAt.set(userId, now)

    const { data, error } = await sb.rpc('place_order', {
      p_symbol: symbol,
      p_side: side,
      p_type: type,
      p_qty: qty,
      p_limit_price: limitPrice,
    })
    if (error) {
      return NextResponse.json<TradeResponseBody>({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json<TradeResponseBody>({ success: true, order_id: data as string })
  } catch (err: any) {
    return NextResponse.json<TradeResponseBody>({ success: false, error: err?.message || 'server_error' }, { status: 500 })
  }
}
