// Domain types used across the app

export type SymbolTicker = 'AAPL' | 'MSFT' | 'TSLA' | 'NVDA' | 'AMZN' | 'GOOGL'

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'open' | 'filled' | 'cancelled'

export interface Tick {
  id?: string
  symbol: SymbolTicker
  price: number
  ts: number // epoch ms
}

export interface Holding {
  id?: string
  symbol: SymbolTicker
  shares: number
  avgPrice: number
}

export interface Portfolio {
  id?: string
  cash: number
  holdings: Holding[]
}

export interface Order {
  id: string
  symbol: SymbolTicker
  side: OrderSide
  type: OrderType
  qty: number
  limitPrice?: number | null
  status: OrderStatus
  createdAt: number
}

export interface Trade {
  id: string
  orderId: string
  symbol: SymbolTicker
  side: OrderSide
  qty: number
  price: number
  ts: number
}
