"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Maximize2, Minimize2, X, RefreshCw, ArrowUp, ArrowDown } from "lucide-react"
import { usePortfolio } from "@/contexts/portfolio-context"
import type { LimitOrder } from "@/contexts/portfolio-context"
import { useUser } from "@/contexts/user-context"
import { useUserStats } from '@/contexts/user-stats-context'
import { useModule } from '@/contexts/module-context'
import { useGameEngine, createLevelUpEvent, createXPGainEvent } from '@/contexts/game-engine-context'
import { toast } from '@/hooks/use-toast'
import { useMarketPrices } from '@/contexts/market-prices-context'
import supabase from '@/lib/supabase'
import { subscribeOrders } from '@/lib/db'

export default function TradingModule() {
  const { dispatchEvent, subscribe } = useGameEngine();
  const [isMaximized, setIsMaximized] = useState(false)
  const [symbol, setSymbol] = useState("AAPL")
  const [quantity, setQuantity] = useState("10")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")
  const [action, setAction] = useState<"buy" | "sell">("buy")
  const [estimatedValue, setEstimatedValue] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({})
  const [ctaPulse, setCtaPulse] = useState(false)
  const { portfolio, addToPortfolio, removeFromPortfolio, placeLimitOrder, cancelLimitOrder, processLimitOrders } = usePortfolio()
  const { incrementTrades, addXP } = useUser()
  const { updateDailyReturn, incrementTrades: incrementUserTrades } = useUserStats()
  const { activeModules } = useModule()
  const isVisible = activeModules.includes('trading')

  // Mock stock data
  const stockData = {
    AAPL: { price: 185.92, change: 1.23, volume: "45.2M", high: 187.45, low: 184.21, avgPrice: 185.0 },
    MSFT: { price: 328.79, change: -0.45, volume: "22.1M", high: 330.12, low: 326.89, avgPrice: 328.0 },
    TSLA: { price: 212.19, change: 5.67, volume: "98.7M", high: 215.43, low: 208.76, avgPrice: 212.0 },
    NVDA: { price: 447.25, change: 12.34, volume: "76.3M", high: 450.12, low: 440.87, avgPrice: 447.0 },
    AMZN: { price: 135.07, change: -2.18, volume: "33.5M", high: 137.24, low: 134.56, avgPrice: 135.0 },
    GOOGL: { price: 142.56, change: 0.87, volume: "18.9M", high: 143.21, low: 141.78, avgPrice: 142.0 },
  }

  const { prices } = useMarketPrices()
  const currentStock = stockData[symbol as keyof typeof stockData] || stockData.AAPL
  const livePrice = prices[symbol] ?? currentStock.price

  useEffect(() => {
    const qty = Number.parseInt(quantity) || 0
    const price = livePrice
    const holding = portfolio.holdings.find(h => h.symbol === symbol)
    
    setEstimatedValue(
      action === 'buy' 
        ? qty * price 
        : holding ? Math.min(qty, holding.shares) * price 
        : 0
    )
  }, [quantity, action, symbol, livePrice, portfolio])

  // --- Limit Order Processing ---
  // Mock price update: call processLimitOrders whenever price changes (reused for UI feedback)
  useEffect(() => {
    processLimitOrders({ [symbol]: livePrice })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice])

  // Listen for game events and show toast notifications
  useEffect(() => {
    const listener = (event: any) => {
      if (event.type === 'achievement') {
        toast({
          title: `Achievement unlocked: ${event.payload.name}`,
          description: event.payload.description,
        })
      }
      if (event.type === 'player_level_up') {
        toast({
          title: `Level Up!`,
          description: `You reached level ${event.payload.level}`,
        })
      }
      if (event.type === 'xp_gain') {
        toast({
          title: `XP Gained`,
          description: `+${event.payload.amount} XP`,
        })
      }
      if (event.type === 'milestone') {
        toast({
          title: `Milestone reached: ${event.payload.name}`,
          description: event.payload.description,
        })
      }
    }
    const unsubscribe = subscribe(listener)
    return () => unsubscribe()
  }, [subscribe])

  // Realtime: subscribe to orders table and show status inline
  useEffect(() => {
    const unsubscribe = subscribeOrders((payload: any) => {
      const row = payload?.new || payload?.old
      if (!row) return
      setRecentOrders((prev) => {
        const next = [row, ...prev.filter(r => r.id !== row.id)].slice(0, 10)
        return next
      })
      const eventType = (payload?.eventType || payload?.type || '').toString().toUpperCase()
      if (eventType === 'UPDATE' && payload?.new?.status === 'filled') {
        const id = payload.new.id
        setFlashMap((m) => ({ ...m, [id]: true }))
        setTimeout(() => setFlashMap((m) => ({ ...m, [id]: false })), 700)
      }
    })
    return () => unsubscribe()
  }, [])

  if (!isVisible) return null

  /**
   * Handles trade execution based on order type (market or limit)
   * - Market orders execute immediately at current price
   * - Limit orders are stubbed for future implementation
   */
  // Handles trade execution for both market and limit orders
  const handleTrade = async () => {
    const qty = Number.parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid positive number of shares" })
      return
    }
    const limitPriceNum = orderType === 'limit' ? Number.parseFloat(limitPrice) : undefined
    if (orderType === 'limit' && (isNaN(limitPriceNum as number) || (limitPriceNum as number) <= 0)) {
      toast({ title: "Invalid limit price", description: "Please enter a valid limit price" })
      return
    }

    // Server-side order placement via API
    try {
      setSubmitting(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        toast({ title: 'Not signed in', description: 'Session missing. Refresh and try again.' })
        setSubmitting(false)
        return
      }
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol, side: action, type: orderType, qty, limit_price: limitPriceNum })
      })
      const payload = await res.json()
      if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Trade failed')
      toast({ title: 'Order placed', description: `${orderType.toUpperCase()} ${action.toUpperCase()} ${qty} ${symbol}` })
      // Auto bracket: if market buy and enabled, place TP limit sell
      if (orderType === 'market' && action === 'buy' && useBracket) {
        const tp = computeTakeProfitPrice(livePrice, Number.parseFloat(tpPct) || 2)
        const res2 = await fetch('/api/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ symbol, side: 'sell', type: 'limit', qty, limit_price: tp })
        })
        const payload2 = await res2.json()
        if (!res2.ok || !payload2?.success) throw new Error(payload2?.error || 'Bracket TP failed')
        toast({ title: 'Auto take-profit placed', description: `SELL ${qty} ${symbol} @ $${tp.toFixed(2)}` })
      }
      setCtaPulse(true)
      setTimeout(() => setCtaPulse(false), 500)
      setQuantity('10')
      if (orderType === 'limit') setLimitPrice('')
    } catch (e: any) {
      toast({ title: 'Order failed', description: e?.message || 'Unable to place order' })
    } finally {
      setSubmitting(false)
    }

    // Local UX feedback for market orders (client-sim)
    const price = livePrice
    if (action === 'buy') {
      const result = addToPortfolio(symbol, qty, price)
      if (result.success) {
        // Using 'milestone' as the most appropriate type for trade events
        dispatchEvent({
          id: `trade-buy-${Date.now()}`,
          type: 'milestone',
          payload: { action: 'buy', symbol, qty, price, orderType },
          timestamp: Date.now(),
        })
        incrementUserTrades()
        addXP(10)
        dispatchEvent(createXPGainEvent(10))
      }
    } else {
      const holding = portfolio.holdings.find((h) => h.symbol === symbol)
      if (!holding) {
        toast({ title: "Stock not owned", description: `You don't own any shares of ${symbol}` })
        return
      }
      const result = removeFromPortfolio(symbol, qty, price)
      if (result.success) {
        const profit = (price - holding.avgPrice) * qty
        const returnPercent = (profit / (holding.avgPrice * qty)) * 100
        updateDailyReturn(returnPercent)
        incrementUserTrades()
        const xpGain = profit > 0 ? 20 : 5
        addXP(xpGain)
        // Using 'milestone' as the most appropriate type for trade events
        dispatchEvent({
          id: `trade-sell-${Date.now()}`,
          type: 'milestone',
          payload: { action: 'sell', symbol, qty, price, profit, orderType },
          timestamp: Date.now(),
        })
        if (profit > 1000) {
          dispatchEvent({
            id: `achievement-big-win-${Date.now()}`,
            type: 'achievement',
            payload: { name: 'Big Win', description: `Sold ${qty} ${symbol} for $${profit.toFixed(2)} profit!` },
            timestamp: Date.now(),
          })
        }
        dispatchEvent(createXPGainEvent(xpGain))
        if (profit > 500) {
          dispatchEvent(createLevelUpEvent(2))
        }
      }
    }
  }

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <TrendingUp size={14} className="mr-2" />
          <span className="text-xs font-semibold">TRADING_SIMULATOR</span>
        </div>
        <div className="flex space-x-1">
          <button className="p-1 hover:bg-green-500/20 rounded">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-bold">{symbol}</div>
            <div className="flex items-center">
              <div className="text-lg font-bold mr-2 animate-pulse">${livePrice.toFixed(2)}</div>
              <div className={`text-xs ${currentStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentStock.change >= 0 ? '↑' : '↓'} {Math.abs(currentStock.change).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs mb-3">
            <div className={`${currentStock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {currentStock.change >= 0 ? "+" : ""}
              {currentStock.change.toFixed(2)}(
              {((currentStock.change / (livePrice - currentStock.change)) * 100).toFixed(2)}%)
            </div>
            <div className="text-green-500/70">Vol: {currentStock.volume}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-500/5 p-2 rounded">
              <div className="text-green-500/70">High</div>
              <div>${currentStock.high.toFixed(2)}</div>
            </div>
            <div className="bg-green-500/5 p-2 rounded">
              <div className="text-green-500/70">Low</div>
              <div>${currentStock.low.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* --- Limit Orders Table --- */}
        <div className="mb-6">
          <div className="text-xs font-bold mb-2">LIMIT ORDERS</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-green-500/20 bg-black rounded">
              <thead className="bg-green-900/10">
                <tr>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Limit Price</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Cancel</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.limitOrders.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-2 text-green-500/50">No limit orders</td></tr>
                )}
                {portfolio.limitOrders.slice().reverse().map((order: LimitOrder) => (
                  <tr key={order.id} className={order.status === 'filled' ? 'bg-green-900/20' : order.status === 'cancelled' ? 'bg-red-900/20' : ''}>
                    <td className="p-2 font-mono">{order.symbol}</td>
                    <td className="p-2">{order.action.toUpperCase()}</td>
                    <td className="p-2">{order.qty}</td>
                    <td className="p-2">${order.limitPrice.toFixed(2)}</td>
                    <td className="p-2 capitalize">
                      <span className={order.status === 'open' ? 'text-yellow-400' : order.status === 'filled' ? 'text-green-400' : 'text-red-400'}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-2">{new Date(order.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2">
                      {order.status === 'open' && (
                        <button onClick={() => cancelLimitOrder(order.id)} className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold mb-2">TRADE</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-green-500/70 block mb-1">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-sm"
              >
                {Object.keys(stockData).map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-green-500/70 block mb-1">Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAction("buy")}
                  className={`flex items-center justify-center py-1 rounded text-sm ${
                    action === "buy" ? "bg-green-500/30 text-green-400" : "bg-green-500/10 hover:bg-green-500/20"
                  }`}
                >
                  <ArrowUp size={14} className="mr-1" />
                  Buy
                </button>
                <button
                  onClick={() => setAction("sell")}
                  className={`flex items-center justify-center py-1 rounded text-sm ${
                    action === "sell" ? "bg-red-500/30 text-red-400" : "bg-red-500/10 hover:bg-red-500/20"
                  }`}
                >
                  <ArrowDown size={14} className="mr-1" />
                  Sell
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-green-500/70 block mb-1">Quantity</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => {
                      const maxShares = action === 'buy'
                        ? (portfolio.cash / (livePrice || 1))
                        : (portfolio.holdings.find(h => h.symbol === symbol)?.shares || 0)
                      const q = Math.max(0.01, Math.round((maxShares * (percent/100)) * 100) / 100)
                      setQuantity(q.toString())
                    }}
                    className="text-xs py-1 bg-green-900/30 hover:bg-green-500/20 rounded"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setQuantity(value)
                  }
                }}
                className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-sm"
                min="0.01"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-xs text-green-500/70 block mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType("market")}
                  className={`py-1 rounded text-sm ${
                    orderType === "market" ? "bg-blue-500/30 text-blue-400" : "bg-blue-500/10 hover:bg-blue-500/20"
                  }`}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType("limit")}
                  className={`py-1 rounded text-sm ${
                    orderType === "limit" ? "bg-blue-500/30 text-blue-400" : "bg-blue-500/10 hover:bg-blue-500/20"
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {orderType === "limit" && (
              <div>
                <label className="text-xs text-green-500/70 block mb-1">Limit Price</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-sm"
                  step="0.01"
                  min="0.01"
                />
              </div>
            )}

            {orderType === 'market' && action === 'buy' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-green-500/70">Auto take‑profit</label>
                <input type="checkbox" checked={useBracket} onChange={(e) => setUseBracket(e.target.checked)} />
                <input type="number" value={tpPct} onChange={(e) => setTpPct(e.target.value)} min="0.5" step="0.5" className="w-16 bg-black border border-green-500/30 rounded px-2 py-1 text-xs" />
                <span className="text-xs text-green-500/70">%</span>
                {useBracket && <span className="text-xs text-green-500/70">→ ${computeTakeProfitPrice(livePrice, Number.parseFloat(tpPct) || 2).toFixed(2)}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs text-green-500/70 mb-1">Order Summary</div>
          <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
            <div className="flex justify-between text-sm mb-1">
              <div>Action:</div>
              <div className={action === "buy" ? "text-green-400" : "text-red-400"}>
                {action === "buy" ? "Buy" : "Sell"} {quantity || '0'} {symbol} @ ${livePrice.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <div>Estimated {action === 'buy' ? 'Cost' : 'Return'}:</div>
              <div className="font-medium">
                ${estimatedValue.toFixed(2)}
              </div>
            </div>
            {action === 'buy' && (
              <div className="flex justify-between text-xs text-green-500/70">
                <div>Available:</div>
                <div>${portfolio.cash.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleTrade}
          disabled={submitting}
          className={`btn-hud w-full ${ctaPulse ? 'ring-2 ring-green-400' : ''} ${action === 'buy' ? 'buy' : 'sell'}`}
        >
          {submitting ? 'Placing…' : `${action === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
        </button>

        {/* Recent orders status */}
        <div className="mt-3">
          <div className="text-xs font-bold mb-2">RECENT ORDERS</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-green-500/20 bg-black rounded">
              <thead className="bg-green-900/10">
                <tr>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Side</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-2 text-green-500/50">No recent orders</td></tr>
                )}
                {recentOrders.map((o) => (
                  <tr key={o.id} className={flashMap[o.id] ? 'bg-green-900/30 transition-colors' : ''}>
                    <td className="p-2 font-mono">{o.symbol}</td>
                    <td className="p-2 capitalize">{o.side}</td>
                    <td className="p-2 capitalize">{o.order_type || o.type}</td>
                    <td className="p-2">{Number(o.qty)}</td>
                    <td className="p-2 capitalize">
                      <span className={o.status === 'open' ? 'text-yellow-400' : o.status === 'filled' ? 'text-green-400' : 'text-red-400'}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-2">{new Date(o.created_at || Date.now()).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
