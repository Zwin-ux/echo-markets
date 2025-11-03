import prisma from './prisma'

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

export async function placeOrder(params: {
  user_id: string
  symbol: string
  side: OrderSide
  type: OrderType
  qty: number
  limit_price?: number
}): Promise<string> {
  const order = await prisma.order.create({
    data: {
      user_id: params.user_id,
      symbol: params.symbol,
      side: params.side.toUpperCase() as 'BUY' | 'SELL',
      type: params.type.toUpperCase() as 'MARKET' | 'LIMIT',
      qty: params.qty,
      limit_price: params.limit_price ?? null,
      status: 'OPEN'
    }
  })
  return order.id
}

export async function cancelOrder(orderId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' }
  })
}

// Basic selectors (you can expand as needed)
export async function fetchOpenOrders(userId?: string): Promise<OrderRow[]> {
  const where = userId ? { status: 'OPEN', user_id: userId } : { status: 'OPEN' }
  const orders = await prisma.order.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })
  return orders.map((order: any) => ({
    ...order,
    side: order.side.toLowerCase() as OrderSide,
    type: order.type.toLowerCase() as OrderType,
    status: order.status.toLowerCase() as OrderStatus,
    created_at: order.created_at.toISOString()
  }))
}

export async function fetchHoldings(userId?: string): Promise<any[]> {
  const where = userId ? { user_id: userId } : {}
  const holdings = await prisma.holding.findMany({ where })
  return holdings
}

export async function fetchPortfolio(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      holdings: true,
      orders: {
        where: { status: 'OPEN' }
      }
    }
  })
  
  if (!user) return null
  
  // Calculate portfolio value (simplified)
  const holdingsValue = user.holdings.reduce((sum: number, holding: any) => {
    // TODO: Get current market price for each symbol
    return sum + (holding.qty * holding.avg_cost)
  }, 0)
  
  return {
    user_id: user.id,
    cash: user.cash,
    holdings_value: holdingsValue,
    total_value: user.cash + holdingsValue,
    holdings: user.holdings,
    open_orders: user.orders
  }
}

// Realtime subscriptions (WebSocket-based replacement for Supabase real-time)
export function subscribeOrders(callback: (payload: any) => void) {
  // WebSocket subscription for orders - using polling fallback for now
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/game/player')
      if (response.ok) {
        const data = await response.json()
        callback({ new: data })
      }
    } catch (error) {
      // Silent fallback
    }
  }, 5000)
  
  return () => {
    clearInterval(interval)
  }
}

export function subscribeTrades(callback: (payload: any) => void) {
  // WebSocket subscription for trades - using polling fallback for now
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/game/leaderboard')
      if (response.ok) {
        const data = await response.json()
        callback({ new: data })
      }
    } catch (error) {
      // Silent fallback
    }
  }, 3000)
  
  return () => {
    clearInterval(interval)
  }
}

export function subscribeTicks(callback: (payload: any) => void) {
  // WebSocket subscription for ticks - using polling fallback for now
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/market/state')
      if (response.ok) {
        const data = await response.json()
        callback({ new: data })
      }
    } catch (error) {
      // Silent fallback
    }
  }, 2000)
  
  return () => {
    clearInterval(interval)
  }
}

// Helper functions for market data
export async function insertTick(params: {
  symbol: string
  price: number
  volume: number
}): Promise<void> {
  await prisma.tick.create({
    data: {
      symbol: params.symbol,
      price: params.price,
      volume: params.volume
    }
  })
}

export async function insertTrade(params: {
  symbol: string
  price: number
  qty: number
  buyer_id: string
  seller_id: string
}): Promise<void> {
  await prisma.trade.create({
    data: {
      symbol: params.symbol,
      price: params.price,
      qty: params.qty,
      buyer_id: params.buyer_id,
      seller_id: params.seller_id
    }
  })
}
