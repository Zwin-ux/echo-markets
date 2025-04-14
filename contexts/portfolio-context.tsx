"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Holding = {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
}

type WatchlistItem = {
  symbol: string
  price: number
  change: number
}

type Alert = {
  symbol: string
  targetPrice: number
  direction: "above" | "below"
}

type Portfolio = {
  cash: number
  holdings: Holding[]
  watchlist: WatchlistItem[]
  alerts: Alert[]
}

type PortfolioContextType = {
  portfolio: Portfolio
  addToPortfolio: (symbol: string, shares: number, price: number) => void
  removeFromPortfolio: (symbol: string, shares: number, price: number) => void
  addToWatchlist: (symbol: string, price: number, change: number) => void
  removeFromWatchlist: (symbol: string) => void
  addAlert: (symbol: string, price: number, direction: "above" | "below") => void
  removeAlert: (symbol: string, price: number) => void
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    // Check localStorage for existing portfolio
    const savedPortfolio = typeof window !== 'undefined' ? localStorage.getItem('portfolio') : null
    const savedLastReset = typeof window !== 'undefined' ? localStorage.getItem('lastReset') : null
    
    // Reset if it's a new day or no saved data
    const today = new Date().toDateString()
    if (!savedPortfolio || savedLastReset !== today) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastReset', today)
      }
      return {
        cash: 100, // Daily $100 reset
        holdings: [],
        watchlist: [],
        alerts: []
      }
    }
    
    return JSON.parse(savedPortfolio)
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio', JSON.stringify(portfolio))
    }
  }, [portfolio])

  const addToPortfolio = (symbol: string, shares: number, price: number) => {
    setPortfolio((prev) => {
      const existingIndex = prev.holdings.findIndex((h) => h.symbol === symbol)
      const newHoldings = [...prev.holdings]
      
      if (existingIndex >= 0) {
        const existing = prev.holdings[existingIndex]
        const totalShares = existing.shares + shares
        const totalCost = existing.shares * existing.avgPrice + shares * price
        const newAvgPrice = totalCost / totalShares

        newHoldings[existingIndex] = {
          ...existing,
          shares: totalShares,
          avgPrice: newAvgPrice,
          currentPrice: price // Update current price
        }
      } else {
        newHoldings.push({
          symbol,
          shares,
          avgPrice: price,
          currentPrice: price
        })
      }

      return {
        ...prev,
        holdings: newHoldings,
        cash: prev.cash - shares * price
      }
    })
  }

  const removeFromPortfolio = (symbol: string, shares: number, price: number) => {
    setPortfolio((prev) => {
      const existingIndex = prev.holdings.findIndex((h) => h.symbol === symbol)
      if (existingIndex < 0) return prev

      const existing = prev.holdings[existingIndex]
      const newHoldings = [...prev.holdings]
      
      if (existing.shares <= shares) {
        return {
          ...prev,
          holdings: prev.holdings.filter((_, i) => i !== existingIndex),
          cash: prev.cash + existing.shares * price
        }
      } else {
        newHoldings[existingIndex] = {
          ...existing,
          shares: existing.shares - shares,
          currentPrice: price // Update current price
        }

        return {
          ...prev,
          holdings: newHoldings,
          cash: prev.cash + shares * price
        }
      }
    })
  }

  const addToWatchlist = (symbol: string, price: number, change: number) => {
    setPortfolio((prev) => {
      if (prev.watchlist.some((w) => w.symbol === symbol)) return prev

      return {
        ...prev,
        watchlist: [...prev.watchlist, { symbol, price, change }],
      }
    })
  }

  const removeFromWatchlist = (symbol: string) => {
    setPortfolio((prev) => ({
      ...prev,
      watchlist: prev.watchlist.filter((w) => w.symbol !== symbol),
    }))
  }

  const addAlert = (symbol: string, price: number, direction: "above" | "below") => {
    setPortfolio((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { symbol, targetPrice: price, direction }],
    }))
  }

  const removeAlert = (symbol: string, price: number) => {
    setPortfolio((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => !(a.symbol === symbol && a.targetPrice === price)),
    }))
  }

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        addToPortfolio,
        removeFromPortfolio,
        addToWatchlist,
        removeFromWatchlist,
        addAlert,
        removeAlert,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider")
  }
  return context
}
