/**
 * Lattice Trading Game - Interactive Demo
 * Engaging trading experience with real-time simulation
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Activity, DollarSign, Zap, Target, Trophy, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  volatility: number
}

interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

interface GameState {
  cash: number
  totalValue: number
  dayChange: number
  dayChangePercent: number
  positions: Position[]
  trades: number
  level: number
  score: number
}

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 2.30, changePercent: 1.33, volume: 45000000, volatility: 0.25 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.25, change: -1.75, changePercent: -0.46, volume: 28000000, volatility: 0.22 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.80, change: 8.90, changePercent: 3.81, volume: 85000000, volatility: 0.45 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 451.20, change: 12.40, changePercent: 2.83, volume: 42000000, volatility: 0.35 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 145.75, change: -0.85, changePercent: -0.58, volume: 32000000, volatility: 0.28 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.90, change: 1.20, changePercent: 0.86, volume: 24000000, volatility: 0.24 }
]

export default function TradePage() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [gameState, setGameState] = useState<GameState>({
    cash: 10000,
    totalValue: 10000,
    dayChange: 0,
    dayChangePercent: 0,
    positions: [],
    trades: 0,
    level: 1,
    score: 0
  })
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [orderAmount, setOrderAmount] = useState<string>('')
  const [dramaScore, setDramaScore] = useState(42)
  const [marketEvents, setMarketEvents] = useState<string[]>([
    "📈 NVDA chip breakthrough drives tech rally",
    "⚡ Tesla delivery numbers beat expectations",
    "🔥 Fed announcement triggers volatility spike"
  ])

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const volatility = stock.volatility
          const randomChange = (Math.random() - 0.5) * volatility * 10
          const newPrice = Math.max(1, stock.price + randomChange)
          const change = newPrice - stock.price
          const changePercent = (change / stock.price) * 100
          
          return {
            ...stock,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100
          }
        })
      )
      
      // Update drama score
      setDramaScore(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)))
      
      // Occasionally add market events
      if (Math.random() < 0.1) {
        const events = [
          "🚨 Tech earnings beat across the board",
          "📊 Bulls take control as sentiment shifts",
          "⚠️ Volume surge triggers volatility alert",
          "🎯 Analyst upgrades fuel rally",
          "💥 Sector rotation in full swing"
        ]
        const newEvent = events[Math.floor(Math.random() * events.length)]
        setMarketEvents(prev => [newEvent, ...prev.slice(0, 2)])
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Update portfolio value when stocks change
  useEffect(() => {
    const newPositions = gameState.positions.map(position => {
      const currentStock = stocks.find(s => s.symbol === position.symbol)
      if (!currentStock) return position
      
      const currentValue = position.shares * currentStock.price
      const pnl = currentValue - (position.shares * position.avgPrice)
      const pnlPercent = (pnl / (position.shares * position.avgPrice)) * 100
      
      return {
        ...position,
        currentValue,
        pnl,
        pnlPercent
      }
    })
    
    const totalPositionValue = newPositions.reduce((sum, pos) => sum + pos.currentValue, 0)
    const newTotalValue = gameState.cash + totalPositionValue
    const dayChange = newTotalValue - 10000
    const dayChangePercent = (dayChange / 10000) * 100
    
    setGameState(prev => ({
      ...prev,
      positions: newPositions,
      totalValue: newTotalValue,
      dayChange,
      dayChangePercent
    }))
  }, [stocks, gameState.cash, gameState.positions])

  const executeOrder = (stock: Stock, type: 'buy' | 'sell', amount: number) => {
    const shares = Math.floor(amount / stock.price)
    const cost = shares * stock.price
    
    if (type === 'buy') {
      if (cost > gameState.cash) {
        alert('Insufficient cash!')
        return
      }
      
      setGameState(prev => {
        const existingPosition = prev.positions.find(p => p.symbol === stock.symbol)
        let newPositions
        
        if (existingPosition) {
          const totalShares = existingPosition.shares + shares
          const totalCost = (existingPosition.shares * existingPosition.avgPrice) + cost
          const newAvgPrice = totalCost / totalShares
          
          newPositions = prev.positions.map(p => 
            p.symbol === stock.symbol 
              ? { ...p, shares: totalShares, avgPrice: newAvgPrice }
              : p
          )
        } else {
          newPositions = [...prev.positions, {
            symbol: stock.symbol,
            shares,
            avgPrice: stock.price,
            currentValue: cost,
            pnl: 0,
            pnlPercent: 0
          }]
        }
        
        return {
          ...prev,
          cash: prev.cash - cost,
          positions: newPositions,
          trades: prev.trades + 1,
          score: prev.score + Math.floor(cost / 100)
        }
      })
    } else {
      const position = gameState.positions.find(p => p.symbol === stock.symbol)
      if (!position || position.shares < shares) {
        alert('Insufficient shares!')
        return
      }
      
      setGameState(prev => {
        const revenue = shares * stock.price
        const newPositions = prev.positions.map(p => 
          p.symbol === stock.symbol 
            ? { ...p, shares: p.shares - shares }
            : p
        ).filter(p => p.shares > 0)
        
        return {
          ...prev,
          cash: prev.cash + revenue,
          positions: newPositions,
          trades: prev.trades + 1,
          score: prev.score + Math.floor(revenue / 100)
        }
      })
    }
    
    setOrderAmount('')
    setSelectedStock(null)
  }

  const getDramaColor = (score: number) => {
    if (score < 25) return 'text-cyan-400'
    if (score < 50) return 'text-yellow-400'
    if (score < 75) return 'text-orange-400'
    return 'text-red-400'
  }

  const getDramaLabel = (score: number) => {
    if (score < 25) return 'CALM'
    if (score < 50) return 'ACTIVE'
    if (score < 75) return 'VOLATILE'
    return 'EXTREME'
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono">
      {/* Header */}
      <header className="border-b border-cyan-500/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image 
              src="/LATTICE Logo in Neon Turquoise.png" 
              alt="Lattice" 
              width={40} 
              height={40}
              className="brightness-110"
            />
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">LATTICE</h1>
              <p className="text-xs text-cyan-300">by Bonelli.dev</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-cyan-300">Portfolio Value</div>
              <div className="text-xl font-bold text-cyan-400">
                ${gameState.totalValue.toLocaleString()}
              </div>
              <div className={`text-sm ${gameState.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gameState.dayChange >= 0 ? '+' : ''}${gameState.dayChange.toFixed(2)} 
                ({gameState.dayChangePercent.toFixed(2)}%)
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-cyan-300">Drama Score</div>
              <div className={`text-xl font-bold ${getDramaColor(dramaScore)}`}>
                {Math.round(dramaScore)}
              </div>
              <div className="text-xs text-cyan-300">{getDramaLabel(dramaScore)}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Market Data */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Live Market Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stocks.map((stock) => (
                  <div 
                    key={stock.symbol}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedStock?.symbol === stock.symbol 
                        ? 'border-cyan-400 bg-cyan-400/10' 
                        : 'border-gray-700 hover:border-cyan-500/50'
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-cyan-400">{stock.symbol}</div>
                        <div className="text-xs text-gray-400">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg">${stock.price.toFixed(2)}</div>
                        <div className={`text-sm flex items-center ${
                          stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {stock.changePercent >= 0 ? (
                            <ArrowUp className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowDown className="w-3 h-3 mr-1" />
                          )}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Panel */}
        <div className="space-y-4">
          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Quick Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStock ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-cyan-300">Selected Stock</div>
                    <div className="font-bold text-cyan-400">{selectedStock.symbol}</div>
                    <div className="text-sm text-gray-400">${selectedStock.price.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={orderType === 'buy' ? 'default' : 'outline'}
                      onClick={() => setOrderType('buy')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      BUY
                    </Button>
                    <Button
                      variant={orderType === 'sell' ? 'default' : 'outline'}
                      onClick={() => setOrderType('sell')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      SELL
                    </Button>
                  </div>
                  
                  <div>
                    <label className="text-sm text-cyan-300">Amount ($)</label>
                    <Input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-gray-800 border-gray-600 text-cyan-400"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      ~{Math.floor(Number(orderAmount) / selectedStock.price)} shares
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => executeOrder(selectedStock, orderType, Number(orderAmount))}
                    disabled={!orderAmount || Number(orderAmount) <= 0}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                  >
                    Execute {orderType.toUpperCase()}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Click a stock to start trading
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Stats */}
          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Cash</span>
                  <span className="font-mono">${gameState.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Trades</span>
                  <span className="font-mono">{gameState.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Score</span>
                  <span className="font-mono text-yellow-400">{gameState.score}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions & News */}
        <div className="space-y-4">
          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameState.positions.length > 0 ? (
                <div className="space-y-3">
                  {gameState.positions.map((position) => (
                    <div key={position.symbol} className="p-2 border border-gray-700 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-cyan-400">{position.symbol}</div>
                          <div className="text-xs text-gray-400">{position.shares} shares</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">${position.currentValue.toFixed(2)}</div>
                          <div className={`text-xs ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  No positions yet - start trading!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Market Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {marketEvents.map((event, index) => (
                  <div key={index} className="text-xs text-cyan-300 p-2 bg-gray-800/50 rounded">
                    {event}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}