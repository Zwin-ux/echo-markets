"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { events } from '@/lib/events'
import { usePortfolio } from '@/contexts/portfolio-context'

type MarketPricesContextType = {
  prices: Record<string, number>
  get: (symbol: string) => number | undefined
}

const MarketPricesContext = createContext<MarketPricesContextType | undefined>(undefined)

export function MarketPricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const { processLimitOrders } = usePortfolio()

  useEffect(() => {
    // Handle incoming ticks and update price map
    const off = events.on('ticks:new', ({ symbol, price }) => {
      setPrices((prev) => {
        const next = { ...prev, [symbol]: price }
        // Kick portfolio limit-order processing with the latest price map
        try {
          processLimitOrders(next)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[MarketPrices] processLimitOrders failed:', e)
        }
        return next
      })
    })
    return () => off()
  }, [processLimitOrders])

  const value = useMemo<MarketPricesContextType>(() => ({
    prices,
    get: (symbol: string) => prices[symbol],
  }), [prices])

  return (
    <MarketPricesContext.Provider value={value}>
      {children}
    </MarketPricesContext.Provider>
  )
}

export function useMarketPrices() {
  const ctx = useContext(MarketPricesContext)
  if (!ctx) throw new Error('useMarketPrices must be used within a MarketPricesProvider')
  return ctx
}

