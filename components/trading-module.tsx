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

export default function TradingModule() {
  const { dispatchEvent, subscribe } = useGameEngine();
  const [isMaximized, setIsMaximized] = useState(false)
  const [symbol, setSymbol] = useState("AAPL")
  const [quantity, setQuantity] = useState("10")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")
  const [action, setAction] = useState<"buy" | "sell">("buy")
  const [estimatedValue, setEstimatedValue] = useState(0)
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

  const currentStock = stockData[symbol as keyof typeof stockData] || stockData.AAPL

  useEffect(() => {
    const qty = Number.parseInt(quantity) || 0
    const price = currentStock.price
    const holding = portfolio.holdings.find(h => h.symbol === symbol)
    
    setEstimatedValue(
      action === 'buy' 
        ? qty * price 
        : holding ? Math.min(qty, holding.shares) * price 
        : 0
    )
  }, [quantity, action, symbol, currentStock.price, portfolio])

  // --- Limit Order Processing ---
  // Mock price update: call processLimitOrders whenever currentStock.price changes
  useEffect(() => {
    processLimitOrders({ [symbol]: currentStock.price })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStock.price])

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

  if (!isVisible) return null

  /**
   * Handles trade execution based on order type (market or limit)
   * - Market orders execute immediately at current price
   * - Limit orders are stubbed for future implementation
   */
  // Handles trade execution for both market and limit orders
  const handleTrade = () => {
    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid positive number of shares" })
      return
    }
    if (orderType === 'limit') {
      const limitPriceNum = Number.parseFloat(limitPrice)
      if (isNaN(limitPriceNum) || limitPriceNum <= 0) {
        toast({ title: "Invalid limit price", description: "Please enter a valid limit price" })
        return
      }
      // Place a limit order
      const result = placeLimitOrder({
        symbol,
        qty,
        limitPrice: limitPriceNum,
        action,
      })
      if (result.success) {
        setQuantity("10")
        setLimitPrice("")
      }
      return
    }
    // Market order logic (immediate execution)
    const price = currentStock.price
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
              <div className="text-lg font-bold mr-2">${currentStock.price.toFixed(2)}</div>
              <div className={`text-xs ${currentStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentStock.change >= 0 ? '↑' : '↓'} {Math.abs(currentStock.change).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs mb-3">
            <div className={`${currentStock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {currentStock.change >= 0 ? "+" : ""}
              {currentStock.change.toFixed(2)}(
              {((currentStock.change / (currentStock.price - currentStock.change)) * 100).toFixed(2)}%)
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
                        ? Math.floor(portfolio.cash / currentStock.price)
                        : portfolio.holdings.find(h => h.symbol === symbol)?.shares || 0
                      setQuantity(Math.floor(maxShares * (percent/100)).toString())
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
                  if (value === '' || /^\d+$/.test(value)) {
                    setQuantity(value)
                  }
                }}
                className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-sm"
                min="1"
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
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs text-green-500/70 mb-1">Order Summary</div>
          <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
            <div className="flex justify-between text-sm mb-1">
              <div>Action:</div>
              <div className={action === "buy" ? "text-green-400" : "text-red-400"}>
                {action === "buy" ? "Buy" : "Sell"} {quantity || '0'} {symbol} @ ${currentStock.price.toFixed(2)}
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
          className={`w-full py-2 rounded text-sm font-bold ${
            action === "buy"
              ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
          }`}
        >
          {action === "buy" ? "Buy" : "Sell"} {symbol}
        </button>
      </div>
    </div>
  )
}
