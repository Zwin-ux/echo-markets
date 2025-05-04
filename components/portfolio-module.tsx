"use client"

import { useState } from "react"
import { Briefcase, Maximize2, Minimize2, X, RefreshCw, Plus, Trash2, Bell } from "lucide-react"
import { usePortfolio } from "@/contexts/portfolio-context"
import type { LimitOrder } from "@/contexts/portfolio-context"
import { toast } from "@/hooks/use-toast"
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

export default function PortfolioModule() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeTab, setActiveTab] = useState<"holdings" | "watchlist" | "alerts" | "limitorders">("holdings")
  const [newSymbol, setNewSymbol] = useState("")
  const [newShares, setNewShares] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const { portfolio, addToPortfolio, removeFromPortfolio, addToWatchlist, removeFromWatchlist } = usePortfolio()

  // Sample performance data
  const performanceData = [
    { date: "Mon", value: 10000 },
    { date: "Tue", value: 10200 },
    { date: "Wed", value: 10150 },
    { date: "Thu", value: 10300 },
    { date: "Fri", value: 10450 },
  ]

  const handleAddToPortfolio = () => {
    if (!newSymbol) {
      toast({ title: "Error", description: "Symbol is required" })
      return
    }
    
    if (!newShares) {
      toast({ title: "Error", description: "Number of shares is required" })
      return
    }

    const symbol = newSymbol.toUpperCase()
    const shares = Number.parseInt(newShares)

    if (isNaN(shares) || shares <= 0) {
      toast({ title: "Error", description: "Shares must be a positive number" })
      return
    }

    // Mock price - in a real app, this would come from an API
    const price = Math.floor(Math.random() * 500) + 50

    const result = addToPortfolio(symbol, shares, price)
    
    if (result.success) {
      setNewSymbol("")
      setNewShares("")
      setShowAddForm(false)
    }
  }

  const handleAddToWatchlist = () => {
    if (!newSymbol) {
      toast({ title: "Error", description: "Symbol is required" })
      return
    }

    const symbol = newSymbol.toUpperCase()

    // Mock price and change - in a real app, this would come from an API
    const price = Math.floor(Math.random() * 500) + 50
    const change = Math.random() * 10 - 5

    const result = addToWatchlist(symbol, price, change)
    
    if (result.success) {
      setNewSymbol("")
      setShowAddForm(false)
    }
  }

  const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0) + portfolio.cash

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Briefcase size={14} className="mr-2" />
          <span className="text-xs font-semibold">PORTFOLIO_TRACKER</span>
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

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-green-500/30">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-bold">PORTFOLIO VALUE</div>
            <div className="text-lg font-bold">${totalValue.toFixed(2)}</div>
          </div>

          <div className="h-24">
            {/* Chart component with performance data */}
            <div className="w-full h-full bg-green-500/5 rounded border border-green-500/20 flex items-center justify-center">
              <div className="text-xs text-green-500/70">
                Portfolio Performance Chart
                <div className="text-center mt-1">
                  <span className="text-green-400 text-sm">+4.5%</span> this week
                </div>
              </div>
            </div>
            {/* Note: Replaced chart components with a placeholder to fix type errors @Brandon */}
            {/* In a real implementation, we should properly type the chart components */}
          </div>

          <div className="flex justify-between text-xs mt-2">
            <div>
              Cash: <span className="text-blue-400">${portfolio.cash.toFixed(2)}</span>
            </div>
            <div>
              Invested: <span className="text-pink-500">${(totalValue - portfolio.cash).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-green-500/30">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`flex-1 py-2 text-xs font-semibold ${
              activeTab === "holdings" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
            }`}
          >
            HOLDINGS
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex-1 py-2 text-xs font-semibold ${
              activeTab === "watchlist" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
            }`}
          >
            WATCHLIST
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex-1 py-2 text-xs font-semibold ${
              activeTab === "alerts" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
            }`}
          >
            ALERTS
          </button>
          <button
            onClick={() => setActiveTab("limitorders")}
            className={`flex-1 py-2 text-xs font-semibold ${
              activeTab === "limitorders" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"}
            `}
          >
            LIMIT ORDERS
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === "limitorders" && (
            <div className="mb-4">
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
                            <button onClick={() => cancelLimitOrder(order.id)} title="Cancel order" className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "holdings" && (
            <>
              {portfolio.holdings.length === 0 ? (
                <div className="text-xs text-center py-4 text-green-500/50">
                  No holdings yet. Add some stocks to your portfolio.
                </div>
              ) : (
                <div className="space-y-2">
                  {portfolio.holdings.map((holding) => (
                    <div
                      key={holding.symbol}
                      className="bg-green-500/5 p-2 rounded border border-green-500/20 flex justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm">{holding.symbol}</div>
                        <div className="text-xs text-green-500/70">
                          {holding.shares} shares @ ${holding.avgPrice}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">${(holding.shares * holding.currentPrice).toFixed(2)}</div>
                        <div
                          className={`text-xs ${holding.currentPrice > holding.avgPrice ? "text-green-400" : "text-red-400"}`}
                        >
                          {holding.currentPrice > holding.avgPrice ? "+" : ""}$
                          {((holding.currentPrice - holding.avgPrice) * holding.shares).toFixed(2)}(
                          {((holding.currentPrice / holding.avgPrice - 1) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddForm && activeTab === "holdings" ? (
                <div className="mt-2 bg-blue-500/10 p-2 rounded border border-blue-500/30">
                  <div className="text-xs font-bold mb-2">ADD POSITION</div>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Symbol (e.g., AAPL)"
                      className="flex-1 bg-black border border-green-500/30 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={newShares}
                      onChange={(e) => setNewShares(e.target.value)}
                      placeholder="Shares"
                      className="w-20 bg-black border border-green-500/30 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddToPortfolio}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 rounded py-1 text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 rounded py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 w-full flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 rounded py-1 text-xs"
                >
                  <Plus size={12} className="mr-1" />
                  Add Position
                </button>
              )}
            </>
          )}

          {activeTab === "watchlist" && (
            <>
              {portfolio.watchlist.length === 0 ? (
                <div className="text-xs text-center py-4 text-green-500/50">
                  Your watchlist is empty. Add stocks to track.
                </div>
              ) : (
                <div className="space-y-2">
                  {portfolio.watchlist.map((item) => (
                    <div
                      key={item.symbol}
                      className="bg-green-500/5 p-2 rounded border border-green-500/20 flex justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm">{item.symbol}</div>
                        <div className="text-xs text-green-500/70">Watchlist</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">${item.price.toFixed(2)}</div>
                        <div className={`text-xs ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change >= 0 ? "+" : ""}
                          {item.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddForm && activeTab === "watchlist" ? (
                <div className="mt-2 bg-blue-500/10 p-2 rounded border border-blue-500/30">
                  <div className="text-xs font-bold mb-2">ADD TO WATCHLIST</div>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Symbol (e.g., AAPL)"
                      className="flex-1 bg-black border border-green-500/30 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddToWatchlist}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 rounded py-1 text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 rounded py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 w-full flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 rounded py-1 text-xs"
                >
                  <Plus size={12} className="mr-1" />
                  Add to Watchlist
                </button>
              )}
            </>
          )}

          {activeTab === "alerts" && (
            <>
              {portfolio.alerts.length === 0 ? (
                <div className="text-xs text-center py-4 text-green-500/50">
                  No price alerts set. Add alerts to get notified.
                </div>
              ) : (
                <div className="space-y-2">
                  {portfolio.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="bg-green-500/5 p-2 rounded border border-green-500/20 flex justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm">{alert.symbol}</div>
                        <div className="text-xs text-green-500/70">
                          Alert when {alert.direction === "above" ? "above" : "below"} ${alert.targetPrice}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button className="p-1 hover:bg-red-500/20 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddForm && activeTab === "alerts" ? (
                <div className="mt-2 bg-blue-500/10 p-2 rounded border border-blue-500/30">
                  <div className="text-xs font-bold mb-2">ADD PRICE ALERT</div>
                  <div className="space-y-2 mb-2">
                    <input
                      type="text"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Symbol (e.g., AAPL)"
                      className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Target Price"
                      className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-xs"
                    />
                    <select className="w-full bg-black border border-green-500/30 rounded px-2 py-1 text-xs">
                      <option value="above">Price Above</option>
                      <option value="below">Price Below</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 rounded py-1 text-xs">
                      Add Alert
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 rounded py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 w-full flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 rounded py-1 text-xs"
                >
                  <Bell size={12} className="mr-1" />
                  Add Price Alert
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
