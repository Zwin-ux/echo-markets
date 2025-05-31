"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Maximize2, Minimize2, X, RefreshCw, ArrowUp, ArrowDown } from "lucide-react"
import { usePortfolio } from "@/contexts/portfolio-context"
import type { LimitOrder } from "@/contexts/portfolio-context"
import { useUser } from "@/contexts/user-context"
import { useUserStats } from '@/contexts/user-stats-context'
import { useModule } from '@/contexts/module-context'
import { useGameEngine, createLevelUpEvent, createXPGainEvent, Stock } from '@/contexts/game-engine-context' // Import Stock
import { toast } from '@/hooks/use-toast'

export default function TradingModule() {
  const { state: engineState, dispatchEvent, subscribe, executeBuyOrder, executeSellOrder } = useGameEngine();
  const { stocks } = engineState; // Get real stocks

  const [isMaximized, setIsMaximized] = useState(false)
  const [symbol, setSymbol] = useState(stocks.length > 0 ? stocks[0].symbol : "") // Default to first available stock
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

  // Get the current stock object from engineState.stocks
  const currentStock = stocks.find(s => s.symbol === symbol);

  useEffect(() => {
    // Initialize symbol if stocks are loaded and symbol is not set or invalid
    if (stocks.length > 0 && (!symbol || !stocks.find(s => s.symbol === symbol))) {
      setSymbol(stocks[0].symbol);
    }
  }, [stocks, symbol]);

  useEffect(() => {
    if (!currentStock) {
      setEstimatedValue(0);
      return;
    }
    const qty = Number.parseInt(quantity) || 0;
    const price = currentStock.price;
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    
    setEstimatedValue(
      action === 'buy' 
        ? qty * price 
        : holding ? Math.min(qty, holding.shares) * price 
        : 0
    );
  }, [quantity, action, symbol, currentStock, portfolio]);

  // --- Limit Order Processing ---
  // This should ideally be moved to GameEngineContext and driven by actual tick updates
  // For now, this will use the current selected stock's price from the engine
  useEffect(() => {
    if (currentStock) {
      processLimitOrders({ [symbol]: currentStock.price });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStock?.price, symbol, processLimitOrders]); // Added processLimitOrders to dependency array

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
    if (!currentStock) {
      toast({ title: "Error", description: "Selected stock data is not available." });
      return;
    }
    const price = currentStock.price;
    let tradeSuccess = false;

    if (action === 'buy') {
      tradeSuccess = executeBuyOrder(symbol, qty, price);
      if (tradeSuccess) {
        dispatchEvent({
          id: `trade-buy-${Date.now()}`,
          type: 'milestone',
          payload: { name: "Successful Buy", description: `Bought ${qty} ${symbol} @ ${price.toFixed(2)}` },
          timestamp: Date.now(),
        });
        incrementUserTrades(); // This seems to be from useUser, ensure it's correctly scoped if different from useUserStats
        addXP(10); // This also seems to be from useUser
        dispatchEvent(createXPGainEvent(10));
      }
    } else { // Sell action
      const holding = portfolio.holdings.find((h) => h.symbol === symbol);
      if (!holding) {
        toast({ title: "Stock not owned", description: `You don't own any shares of ${symbol}` });
        return;
      }
      tradeSuccess = executeSellOrder(symbol, qty, price);
      if (tradeSuccess) {
        const profit = (price - holding.avgPrice) * Math.min(qty, holding.shares); // Calculate profit on actual shares sold
        // updateDailyReturn(returnPercent); // Ensure updateDailyReturn is available and correctly typed
        incrementUserTrades();
        const xpGain = profit > 0 ? 20 : 5;
        addXP(xpGain);
        dispatchEvent({
          id: `trade-sell-${Date.now()}`,
          type: 'milestone',
          payload: { name: "Successful Sell", description: `Sold ${qty} ${symbol} @ ${price.toFixed(2)} for a profit/loss of ${profit.toFixed(2)}` },
          timestamp: Date.now(),
        });
        if (profit > 1000) {
          dispatchEvent({
            id: `achievement-big-win-${Date.now()}`,
            type: 'achievement',
            payload: { name: 'Big Win', description: `Sold ${qty} ${symbol} for $${profit.toFixed(2)} profit!` },
            timestamp: Date.now(),
          });
        }
        dispatchEvent(createXPGainEvent(xpGain));
        // Example: Level up based on profit. This logic can be more sophisticated.
        if (profit > 500 && engineState.events.find(e => e.type === 'player_level_up' && e.payload.level === 1)) { // Simple check to avoid rapid level ups
           dispatchEvent(createLevelUpEvent(engineState.events.filter(e => e.type === 'player_level_up').length + 1 ));
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
        {currentStock ? (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-bold">{currentStock.name} ({currentStock.symbol})</div>
              <div className="flex items-center">
                <div className="text-lg font-bold mr-2">${currentStock.price.toFixed(2)}</div>
                {/* Price change indicators can be added if history is sufficiently populated */}
              </div>
            </div>

            {/* Simplified display - more details like change, volume, high/low can be added if available and needed */}
            <div className="flex justify-between text-xs mb-3">
              <div className="text-green-500/70">Volatility: {currentStock.volatility.toFixed(2)}</div>
              {/* Volume can be added if tracked by the engine */}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center text-green-500/70">
            {stocks.length > 0 ? "Select a stock" : "No stocks available in the market."}
          </div>
        )}

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
                disabled={stocks.length === 0}
              >
                {stocks.map((stock: Stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol})
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
                      if (!currentStock) return;
                      const maxShares = action === 'buy' 
                        ? Math.floor(portfolio.cash / currentStock.price)
                        : portfolio.holdings.find(h => h.symbol === symbol)?.shares || 0;
                      setQuantity(Math.max(0, Math.floor(maxShares * (percent/100))).toString());
                    }}
                    className="text-xs py-1 bg-green-900/30 hover:bg-green-500/20 rounded"
                    disabled={!currentStock}
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
                {action === "buy" ? "Buy" : "Sell"} {quantity || '0'} {symbol || "N/A"}
                {currentStock && ` @ $${currentStock.price.toFixed(2)}`}
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
          disabled={!currentStock || !quantity || parseInt(quantity) <= 0}
        >
          {action === "buy" ? "Buy" : "Sell"} {symbol || "N/A"}
        </button>
      </div>
    </div>
  )
}
