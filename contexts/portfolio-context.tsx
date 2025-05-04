"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/hooks/use-toast"

// TODO: Use a more robust type system for Result. Consider using a discriminated union.
type Result<T> = { success: true, data?: T } | { success: false, error: string }

// TODO: Add validation for symbol format (e.g. regex).
type Holding = {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
}

// TODO: Add validation for symbol format (e.g. regex).
type WatchlistItem = {
  symbol: string
  price: number
  change: number
}

// TODO: Consider using a more specific type for direction (e.g. enum).
type Alert = {
  symbol: string
  targetPrice: number
  direction: "above" | "below"
}

// Limit order type
export type LimitOrder = {
  id: string
  symbol: string
  qty: number
  limitPrice: number
  action: "buy" | "sell"
  status: "open" | "filled" | "cancelled"
  timestamp: number
}

type Portfolio = {
  cash: number
  holdings: Holding[]
  watchlist: WatchlistItem[]
  alerts: Alert[]
  limitOrders: LimitOrder[]
}

type PortfolioContextType = {
  portfolio: Portfolio
  addToPortfolio: (symbol: string, shares: number, price: number) => Result<void>
  removeFromPortfolio: (symbol: string, shares: number, price: number) => Result<void>
  addToWatchlist: (symbol: string, price: number, change: number) => Result<void>
  removeFromWatchlist: (symbol: string) => Result<void>
  addAlert: (symbol: string, price: number, direction: "above" | "below") => Result<void>
  removeAlert: (symbol: string, price: number) => Result<void>
  placeLimitOrder: (order: Omit<LimitOrder, "id" | "status" | "timestamp">) => Result<void>
  cancelLimitOrder: (orderId: string) => Result<void>
  processLimitOrders: (priceMap: Record<string, number>) => void // Call this with latest prices
}

// Create a context for the portfolio
const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

// Portfolio provider component
export function PortfolioProvider({ children }: { children: ReactNode }) {
  // Initialize the portfolio state with a default value
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
        alerts: [],
        limitOrders: []
      }
    }
    
    // Add limitOrders if missing (for backward compatibility)
    const parsed = JSON.parse(savedPortfolio)
    if (!parsed.limitOrders) parsed.limitOrders = []
    // Fix status type for legacy or string-typed orders
    parsed.limitOrders = parsed.limitOrders.map((order: any) => ({
      ...order,
      status: order.status === 'filled' ? 'filled' : order.status === 'cancelled' ? 'cancelled' : 'open',
    }))
    return parsed
  })

  // Save the portfolio to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio', JSON.stringify(portfolio))
    }
  }, [portfolio])

  // Function to add a stock to the portfolio
  const addToPortfolio = (symbol: string, shares: number, price: number): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    if (isNaN(shares) || shares <= 0) {
      toast({ title: "Error", description: "Shares must be a positive number" })
      return { success: false, error: "Shares must be a positive number" }
    }
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Price must be a positive number" })
      return { success: false, error: "Price must be a positive number" }
    }
    
    // Check if user has enough cash
    const totalCost = shares * price
    if (portfolio.cash < totalCost) {
      toast({ title: "Insufficient funds", description: `You need $${totalCost.toFixed(2)} but only have $${portfolio.cash.toFixed(2)}` })
      return { success: false, error: "Insufficient funds" }
    }
    
    // Update the portfolio state
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
    
    // Display a success message
    toast({ 
      title: "Purchase successful", 
      description: `Bought ${shares} shares of ${symbol} at $${price.toFixed(2)}` 
    })
    
    return { success: true }
  }

  // Function to remove a stock from the portfolio
  const removeFromPortfolio = (symbol: string, shares: number, price: number): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    if (isNaN(shares) || shares <= 0) {
      toast({ title: "Error", description: "Shares must be a positive number" })
      return { success: false, error: "Shares must be a positive number" }
    }
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Price must be a positive number" })
      return { success: false, error: "Price must be a positive number" }
    }
    
    // Check if user has the stock
    const existingIndex = portfolio.holdings.findIndex((h) => h.symbol === symbol)
    if (existingIndex < 0) {
      toast({ title: "Stock not found", description: `You don't own any shares of ${symbol}` })
      return { success: false, error: "Stock not found in portfolio" }
    }
    
    // Check if user has enough shares
    const existing = portfolio.holdings[existingIndex]
    if (existing.shares < shares) {
      toast({ 
        title: "Insufficient shares", 
        description: `You only have ${existing.shares} shares of ${symbol}` 
      })
      return { success: false, error: "Insufficient shares" }
    }
    
    // Update the portfolio state
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
    
    // Calculate profit or loss
    const profit = (price - existing.avgPrice) * shares
    const profitText = profit >= 0 
      ? `profit: $${profit.toFixed(2)}` 
      : `loss: $${Math.abs(profit).toFixed(2)}`
    
    // Display a success message
    toast({ 
      title: "Sale successful", 
      description: `Sold ${shares} shares of ${symbol} at $${price.toFixed(2)} (${profitText})` 
    })
    
    return { success: true }
  }

  // --- Limit Order Functions ---
  // Place a new limit order
  const placeLimitOrder = (order: Omit<LimitOrder, "id" | "status" | "timestamp">): Result<void> => {
    // Validate inputs
    if (!order.symbol || order.symbol.trim() === "") {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    if (isNaN(order.qty) || order.qty <= 0) {
      toast({ title: "Error", description: "Quantity must be positive" })
      return { success: false, error: "Quantity must be positive" }
    }
    if (isNaN(order.limitPrice) || order.limitPrice <= 0) {
      toast({ title: "Error", description: "Limit price must be positive" })
      return { success: false, error: "Limit price must be positive" }
    }
    if (order.action !== "buy" && order.action !== "sell") {
      toast({ title: "Error", description: "Invalid order action" })
      return { success: false, error: "Invalid order action" }
    }
    // Check funds/shares
    if (order.action === "buy") {
      if (portfolio.cash < order.qty * order.limitPrice) {
        toast({ title: "Insufficient funds", description: `You need $${(order.qty * order.limitPrice).toFixed(2)} but only have $${portfolio.cash.toFixed(2)}` })
        return { success: false, error: "Insufficient funds" }
      }
    } else {
      const holding = portfolio.holdings.find(h => h.symbol === order.symbol)
      if (!holding || holding.shares < order.qty) {
        toast({ title: "Insufficient shares", description: `You only have ${holding?.shares || 0} shares of ${order.symbol}` })
        return { success: false, error: "Insufficient shares" }
      }
    }
    // Place order
    setPortfolio(prev => ({
      ...prev,
      limitOrders: [
        ...prev.limitOrders,
        {
          ...order,
          id: `limit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          status: "open",
          timestamp: Date.now()
        }
      ],
      // Lock cash/shares
      cash: order.action === "buy" ? prev.cash - order.qty * order.limitPrice : prev.cash,
      holdings: order.action === "sell"
        ? prev.holdings.map(h => h.symbol === order.symbol ? { ...h, shares: h.shares - order.qty } : h)
        : prev.holdings
    }))
    toast({ title: "Limit order placed", description: `${order.action === "buy" ? "Buy" : "Sell"} ${order.qty} ${order.symbol} @ $${order.limitPrice}` })
    return { success: true }
  }

  // Cancel a limit order
  const cancelLimitOrder = (orderId: string): Result<void> => {
    const order = portfolio.limitOrders.find(o => o.id === orderId && o.status === "open")
    if (!order) {
      toast({ title: "Order not found", description: "No open limit order with this ID" })
      return { success: false, error: "Order not found" }
    }
    setPortfolio(prev => {
      let cash = prev.cash
      let holdings = [...prev.holdings]
      // Unlock cash/shares
      if (order.action === "buy") {
        cash += order.qty * order.limitPrice
      } else {
        // Return shares to holdings
        const idx = holdings.findIndex(h => h.symbol === order.symbol)
        if (idx >= 0) {
          holdings[idx] = { ...holdings[idx], shares: holdings[idx].shares + order.qty }
        } else {
          holdings.push({ symbol: order.symbol, shares: order.qty, avgPrice: order.limitPrice, currentPrice: order.limitPrice })
        }
      }
      return {
        ...prev,
        limitOrders: prev.limitOrders.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o),
        cash,
        holdings
      }
    })
    toast({ title: "Limit order cancelled", description: `Order ${orderId} cancelled` })
    return { success: true }
  }

  // Process limit orders given a price map {symbol: price}
  const processLimitOrders = (priceMap: Record<string, number>) => {
    setPortfolio(prev => {
      let cash = prev.cash
      let holdings = [...prev.holdings]
      const updatedOrders = prev.limitOrders.map(order => {
        if (order.status !== "open") return order
        const currentPrice = priceMap[order.symbol]
        if (typeof currentPrice === "undefined") return order
        if (
          (order.action === "buy" && currentPrice <= order.limitPrice) ||
          (order.action === "sell" && currentPrice >= order.limitPrice)
        ) {
          // Fill order
          if (order.action === "buy") {
            // Add to holdings
            const idx = holdings.findIndex(h => h.symbol === order.symbol)
            if (idx >= 0) {
              const existing = holdings[idx]
              const totalShares = existing.shares + order.qty
              const totalCost = existing.shares * existing.avgPrice + order.qty * order.limitPrice
              const newAvgPrice = totalCost / totalShares
              holdings[idx] = { ...existing, shares: totalShares, avgPrice: newAvgPrice, currentPrice }
            } else {
              holdings.push({ symbol: order.symbol, shares: order.qty, avgPrice: order.limitPrice, currentPrice })
            }
          } else {
            // Sell: add cash
            cash += order.qty * order.limitPrice
          }
          toast({ title: "Limit order filled", description: `${order.action === "buy" ? "Bought" : "Sold"} ${order.qty} ${order.symbol} @ $${order.limitPrice}` })
          return { ...order, status: "filled" }
        }
        return order
      })
      return { ...prev, cash, holdings, limitOrders: updatedOrders }
    })
  }

  // Function to add a stock to the watchlist
  const addToWatchlist = (symbol: string, price: number, change: number): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Price must be a positive number" })
      return { success: false, error: "Price must be a positive number" }
    }
    
    // Check if already in watchlist
    if (portfolio.watchlist.some((w) => w.symbol === symbol)) {
      toast({ title: "Already in watchlist", description: `${symbol} is already in your watchlist` })
      return { success: false, error: "Symbol already in watchlist" }
    }
    
    // Update the portfolio state
    setPortfolio((prev) => {
      if (prev.watchlist.some((w) => w.symbol === symbol)) return prev

      return {
        ...prev,
        watchlist: [...prev.watchlist, { symbol, price, change }],
      }
    })
    
    // Display a success message
    toast({ 
      title: "Added to watchlist", 
      description: `${symbol} has been added to your watchlist` 
    })
    
    return { success: true }
  }

  // Function to remove a stock from the watchlist
  const removeFromWatchlist = (symbol: string): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    // Check if in watchlist
    if (!portfolio.watchlist.some((w) => w.symbol === symbol)) {
      toast({ title: "Not in watchlist", description: `${symbol} is not in your watchlist` })
      return { success: false, error: "Symbol not in watchlist" }
    }
    
    // Update the portfolio state
    setPortfolio((prev) => ({
      ...prev,
      watchlist: prev.watchlist.filter((w) => w.symbol !== symbol),
    }))
    
    // Display a success message
    toast({ 
      title: "Removed from watchlist", 
      description: `${symbol} has been removed from your watchlist` 
    })
    
    return { success: true }
  }

  // Function to add an alert
  const addAlert = (symbol: string, price: number, direction: "above" | "below"): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Price must be a positive number" })
      return { success: false, error: "Price must be a positive number" }
    }
    
    // Check if alert already exists
    if (portfolio.alerts.some((a) => a.symbol === symbol && a.targetPrice === price && a.direction === direction)) {
      toast({ title: "Alert already exists", description: `This alert for ${symbol} already exists` })
      return { success: false, error: "Alert already exists" }
    }
    
    // Update the portfolio state
    setPortfolio((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { symbol, targetPrice: price, direction }],
    }))
    
    // Display a success message
    toast({ 
      title: "Alert created", 
      description: `Alert set for ${symbol} when price goes ${direction} $${price.toFixed(2)}` 
    })
    
    return { success: true }
  }

  // Function to remove an alert
  const removeAlert = (symbol: string, price: number): Result<void> => {
    // Validate inputs
    if (!symbol || symbol.trim() === '') {
      toast({ title: "Error", description: "Symbol is required" })
      return { success: false, error: "Symbol is required" }
    }
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Price must be a positive number" })
      return { success: false, error: "Price must be a positive number" }
    }
    
    // Check if alert exists
    if (!portfolio.alerts.some((a) => a.symbol === symbol && a.targetPrice === price)) {
      toast({ title: "Alert not found", description: `This alert for ${symbol} doesn't exist` })
      return { success: false, error: `This alert for ${symbol} doesn't exist` }
    }
    
    // Update the portfolio state
    setPortfolio((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => !(a.symbol === symbol && a.targetPrice === price)),
    }))
    
    // Display a success message
    toast({ 
      title: "Alert removed", 
      description: `Alert for ${symbol} at $${price.toFixed(2)} has been removed` 
    })
    
    return { success: true }
  }

  // Return the portfolio context provider
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
        placeLimitOrder,
        cancelLimitOrder,
        processLimitOrders,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

// Hook to use the portfolio context
export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider")
  }
  return context
}
