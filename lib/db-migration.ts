// Updated database operations to replace Supabase functionality
import db from './database'

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'open' | 'filled' | 'cancelled'

export type OrderRow = {
  id: string
  user_id: string
  symbol: string
  side: OrderSide
  type: OrderType
  qty: number
  limit_price: number | null
  status: OrderStatus
  created_at: string
}

export type TickRow = {
  id: string
  symbol: string
  price: number
  volume: number
  timestamp: string
}

export type TradeRow = {
  id: string
  symbol: string
  price: number
  qty: number
  buyer_id: string
  seller_id: string
  timestamp: string
}

export type HoldingRow = {
  id: string
  user_id: string
  symbol: string
  qty: number
  avg_cost: number
}

// Order operations
export async function placeOrder(params: {
  user_id: string
  symbol: string
  side: OrderSide
  type: OrderType
  qty: number
  limit_price?: number
}): Promise<string> {
  const order = await db.create<OrderRow>('orders', {
    user_id: params.user_id,
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    qty: params.qty,
    limit_price: params.limit_price ?? null,
    status: 'open',
    created_at: new Date().toISOString()
  })
  
  return order.id
}

export async function cancelOrder(orderId: string): Promise<void> {
  await db.update('orders', { id: orderId }, { status: 'cancelled' })
}

export async function fetchOpenOrders(userId?: string): Promise<OrderRow[]> {
  const where = userId ? { status: 'open', user_id: userId } : { status: 'open' }
  return db.findMany<OrderRow>('orders', where)
}

export async function fetchOrderHistory(userId: string): Promise<OrderRow[]> {
  return db.findMany<OrderRow>('orders', { user_id: userId })
}

// Holdings operations
export async function fetchHoldings(userId?: string): Promise<HoldingRow[]> {
  const where = userId ? { user_id: userId } : {}
  return db.findMany<HoldingRow>('holdings', where)
}

export async function updateHolding(params: {
  user_id: string
  symbol: string
  qty_change: number
  price: number
}): Promise<void> {
  const existing = await db.findUnique<HoldingRow>('holdings', {
    user_id: params.user_id,
    symbol: params.symbol
  })
  
  if (existing) {
    const newQty = existing.qty + params.qty_change
    if (newQty <= 0) {
      await db.delete('holdings', { id: existing.id })
    } else {
      const newAvgCost = ((existing.avg_cost * existing.qty) + (params.price * params.qty_change)) / newQty
      await db.update('holdings', { id: existing.id }, {
        qty: newQty,
        avg_cost: newAvgCost
      })
    }
  } else if (params.qty_change > 0) {
    await db.create<HoldingRow>('holdings', {
      user_id: params.user_id,
      symbol: params.symbol,
      qty: params.qty_change,
      avg_cost: params.price
    })
  }
}

// Market data operations
export async function insertTick(params: {
  symbol: string
  price: number
  volume: number
}): Promise<void> {
  await db.create<TickRow>('ticks', {
    symbol: params.symbol,
    price: params.price,
    volume: params.volume,
    timestamp: new Date().toISOString()
  })
}

export async function fetchLatestTicks(symbols?: string[]): Promise<TickRow[]> {
  const where = symbols ? { symbol: { in: symbols } } : {}
  return db.findMany<TickRow>('ticks', where)
}

export async function insertTrade(params: {
  symbol: string
  price: number
  qty: number
  buyer_id: string
  seller_id: string
}): Promise<void> {
  await db.create<TradeRow>('trades', {
    symbol: params.symbol,
    price: params.price,
    qty: params.qty,
    buyer_id: params.buyer_id,
    seller_id: params.seller_id,
    timestamp: new Date().toISOString()
  })
}

// Real-time subscriptions
export function subscribeOrders(callback: (payload: any) => void) {
  return db.subscribe('orders', callback)
}

export function subscribeTrades(callback: (payload: any) => void) {
  return db.subscribe('trades', callback)
}

export function subscribeTicks(callback: (payload: any) => void) {
  return db.subscribe('ticks', callback)
}

// Portfolio calculations (replaces Supabase views/functions)
export async function calculatePortfolio(userId: string): Promise<{
  total_value: number
  cash_balance: number
  holdings_value: number
  day_change: number
  day_change_percent: number
}> {
  const holdings = await fetchHoldings(userId)
  const latestTicks = await fetchLatestTicks(holdings.map(h => h.symbol))
  
  let holdingsValue = 0
  let dayChange = 0
  
  for (const holding of holdings) {
    const tick = latestTicks.find(t => t.symbol === holding.symbol)
    if (tick) {
      const currentValue = holding.qty * tick.price
      const costBasis = holding.qty * holding.avg_cost
      holdingsValue += currentValue
      dayChange += currentValue - costBasis
    }
  }
  
  // TODO: Fetch actual cash balance from user account
  const cashBalance = 10000 // Placeholder
  const totalValue = cashBalance + holdingsValue
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0
  
  return {
    total_value: totalValue,
    cash_balance: cashBalance,
    holdings_value: holdingsValue,
    day_change: dayChange,
    day_change_percent: dayChangePercent
  }
}