"use client"

import { useEffect } from 'react'
import { subscribeTicks, subscribeOrders, subscribeTrades } from '@/lib/db'
import { events } from '@/lib/events'

/**
 * Supabase Realtime → Client Event Bus bridge.
 * Subscribes to DB changes and emits app-level events.
 */
export default function RealtimeBridge() {
  useEffect(() => {
    // Ticks
    const unsubTicks = subscribeTicks((payload: any) => {
      const row = payload?.new
      if (!row) return
      const ts = typeof row.ts === 'string' ? Date.parse(row.ts) : Number(row.ts) || Date.now()
      const price = typeof row.price === 'string' ? Number(row.price) : row.price
      if (row.symbol && !Number.isNaN(price)) {
        events.emit('ticks:new', { symbol: row.symbol, price, ts })
      }
    })

    // Orders
    const unsubOrders = subscribeOrders((payload: any) => {
      const type = (payload?.eventType || payload?.type || '').toString().toLowerCase()
      const row = type === 'delete' ? payload?.old : payload?.new
      if (!type || !row) return
      events.emit('orders:changed', { type, row })
    })

    // Trades (only new inserts)
    const unsubTrades = subscribeTrades((payload: any) => {
      const eventType = (payload?.eventType || '').toString().toUpperCase()
      if (eventType === 'INSERT' && payload?.new) {
        events.emit('trades:new', { row: payload.new })
      }
    })

    return () => {
      unsubTicks?.()
      unsubOrders?.()
      unsubTrades?.()
    }
  }, [])

  return null
}

