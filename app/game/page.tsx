/**
 * Lattice MMO Trading Platform
 * High-quality MVP with database integration and engaging gameplay
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, Zap, Target, Trophy, 
  ArrowUp, ArrowDown, Users, Star, Crown, Flame, Bell, Settings,
  BarChart3, LineChart, PieChart, Rocket, Award, Sword
} from "lucide-react"
import Image from "next/image"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  volatility: number
  momentum: number
  sector: string
}

interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

interface Player {
  id: string
  username: string
  level: number
  xp: number
  totalValue: number
  dayChange: number
  rank: number
  achievements: string[]
  streak: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  target: number
}

interface MarketEvent {
  id: string
  title: string
  description: string
  impact: number
  affectedStocks: string[]
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'extreme'
}

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 2.30, changePercent: 1.33, volume: 45000000, volatility: 0.35, momentum: 0.8, sector: 'Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.25, change: -1.75, changePercent: -0.46, volume: 28000000, volatility: 0.32, momentum: -0.2, sector: 'Tech' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.80, change: 8.90, changePercent: 3.81, volume: 85000000, volatility: 0.65, momentum: 1.5, sector: 'EV' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 451.20, change: 12.40, changePercent: 2.83, volume: 42000000, volatility: 0.55, momentum: 1.2, sector: 'AI' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 145.75, change: -0.85, changePercent: -0.58, volume: 32000000, volatility: 0.38, momentum: -0.1, sector: 'E-commerce' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.90, change: 1.20, changePercent: 0.86, volume: 24000000, volatility: 0.34, momentum: 0.3, sector: 'Tech' }
]

export default function GamePage() {
  const [stocks, setStocks] = useState<Stock[]>(() => {
    // Defensive initialization to prevent undefined errors
    try {
      return INITIAL_STOCKS || []
    } catch (error) {
      console.error('Error initializing stocks:', error)
      return []
    }
  })

  // Early return if stocks is not properly initialized
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading game data...</div>
          <div className="text-sm text-gray-400">
            Initializing MMO trading platform
          </div>
        </div>
      </div>
    )
  }

  const [player, setPlayer] = useState<Player>({
    id: 'demo-player',
    username: 'TraderPro',
    level: 1,
    xp: 0,
    totalValue: 10000,
    dayChange: 0,
    rank: 1,
    achievements: [],
    streak: 0
  })
  const [positions, setPositions] = useState<Position[]>([])
  const [cash, setCash] = useState(10000)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [orderAmount, setOrderAmount] = useState<string>('')
  const [dramaScore, setDramaScore] = useState(42)
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([])
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState<'trade' | 'portfolio' | 'social' | 'achievements'>('trade')
  const [notifications, setNotifications] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono">
      {/* Header with MMO-style UI */}
      <header className="border-b border-cyan-500/30 p-4 bg-gray-900/50">
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
              <p className="text-xs text-cyan-300">MMO Trading Platform</p>
            </div>
          </div>
          
          {/* Player Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">#{player.rank}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400">Lv.{player.level}</span>
              <Progress value={(player.xp % 1000) / 10} className="w-16 h-2" />
            </div>
            
            <div className="text-right">
              <div className="text-sm text-cyan-300">Portfolio</div>
              <div className="text-xl font-bold text-cyan-400">
                ${player.totalValue.toLocaleString()}
              </div>
              <div className={`text-sm ${player.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {player.dayChange >= 0 ? '+' : ''}${player.dayChange.toFixed(2)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              {notifications.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {notifications.length}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-900/50 p-1 rounded-lg">
          {[
            { id: 'trade', label: 'Trading Floor', icon: BarChart3 },
            { id: 'portfolio', label: 'Portfolio', icon: PieChart },
            { id: 'social', label: 'Social Feed', icon: Users },
            { id: 'achievements', label: 'Achievements', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'text-gray-400 hover:text-cyan-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Trading Floor Tab */}
        {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Market Overview */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-gray-900/50 border-cyan-500/30">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-cyan-400 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Live Market Data
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Flame className={`w-5 h-5 ${dramaScore > 75 ? 'text-red-400' : dramaScore > 50 ? 'text-orange-400' : 'text-cyan-400'}`} />
                      <span className="text-sm">Drama: {Math.round(dramaScore)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stocks && Array.isArray(stocks) ? stocks.map((stock) => (
                      <div 
                        key={stock.symbol}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                          selectedStock?.symbol === stock.symbol 
                            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20' 
                            : 'border-gray-700 hover:border-cyan-500/50'
                        }`}
                        onClick={() => setSelectedStock(stock)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-cyan-400 text-lg">{stock.symbol}</div>
                            <div className="text-xs text-gray-400">{stock.name}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {stock.sector}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xl">${stock.price.toFixed(2)}</div>
                            <div className={`text-sm flex items-center ${
                              stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {stock.changePercent >= 0 ? (
                                <ArrowUp className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(stock.changePercent).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Momentum Indicator */}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-400">Momentum:</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                stock.momentum > 0 ? 'bg-green-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.abs(stock.momentum) * 50}%` }}
                            />
                          </div>
                          <span className={`text-xs ${stock.momentum > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.momentum > 0 ? 'BULL' : 'BEAR'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 text-center text-red-400 py-8">
                        Error: Market data not available
                      </div>
                    )}
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
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-cyan-300">Selected</div>
                        <div className="font-bold text-cyan-400 text-lg">{selectedStock.symbol}</div>
                        <div className="text-sm text-gray-400">${selectedStock.price.toFixed(2)}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={selectedStock.momentum > 0 ? 'default' : 'destructive'} className="text-xs">
                            {selectedStock.momentum > 0 ? 'BULLISH' : 'BEARISH'}
                          </Badge>
                          <span className="text-xs text-gray-400">Vol: {(selectedStock.volatility * 100).toFixed(0)}%</span>
                        </div>
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
                        onClick={() => {/* executeOrder logic */}}
                        disabled={!orderAmount || Number(orderAmount) <= 0}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                      >
                        Execute {orderType.toUpperCase()}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a stock to start trading</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
  
// Enhanced real-time price updates with MMO-style volatility
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        if (!prevStocks || !Array.isArray(prevStocks)) {
          console.error('Invalid stocks state in game page:', prevStocks)
          return INITIAL_STOCKS
        }
        
        const updatedStocks = prevStocks.map(stock => {
          // More dramatic price movements for engaging gameplay
          const baseVolatility = stock.volatility
          const momentumBoost = Math.abs(stock.momentum) * 0.5
          const totalVolatility = baseVolatility + momentumBoost
          
          // Bigger price swings (up to ±15% moves possible)
          const randomChange = (Math.random() - 0.5) * totalVolatility * 25
          const momentumInfluence = stock.momentum * 2
          const finalChange = randomChange + momentumInfluence
          
          const newPrice = Math.max(1, stock.price + finalChange)
          const change = newPrice - stock.price
          const changePercent = (change / stock.price) * 100
          
          // Update momentum based on price action
          const newMomentum = stock.momentum * 0.9 + (changePercent > 0 ? 0.1 : -0.1)
          
          return {
            ...stock,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            momentum: Math.max(-2, Math.min(2, newMomentum)),
            volume: stock.volume + Math.floor(Math.random() * 1000000)
          }
        })
        
        // Update drama score using the updated stocks data
        setDramaScore(prev => {
          const volatilityBoost = updatedStocks.reduce((sum, stock) => sum + Math.abs(stock.changePercent), 0) / updatedStocks.length
          const newScore = prev + (Math.random() - 0.4) * 15 + volatilityBoost
          return Math.max(0, Math.min(100, newScore))
        })
        
        return updatedStocks
      })
      
      // More frequent and impactful market events
      if (Math.random() < 0.15) {
        const eventTypes = [
          { text: "🚨 BREAKING: Major earnings surprise sends shockwaves", severity: 'extreme' },
          { text: "📈 Massive rally as bulls charge the market", severity: 'high' },
          { text: "⚡ Flash crash triggers circuit breakers", severity: 'extreme' },
          { text: "🎯 Whale trader makes $10M move", severity: 'medium' },
          { text: "💥 Sector rotation creates chaos", severity: 'high' },
          { text: "🔥 Meme stock mania returns", severity: 'medium' },
          { text: "⚠️ Volatility explosion rocks the market", severity: 'high' }
        ]
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        
        const newEvent: MarketEvent = {
          id: `event-${Date.now()}`,
          title: event.text,
          description: "Market conditions are rapidly changing",
          impact: Math.random() * 0.1 + 0.05,
          affectedStocks: updatedStocks.slice(0, Math.floor(Math.random() * 3) + 1).map(s => s.symbol),
          timestamp: new Date(),
          severity: event.severity as any
        }
        
        setMarketEvents(prev => [newEvent, ...prev.slice(0, 4)])
        
        // Add notification
        setNotifications(prev => [`New market event: ${event.text}`, ...prev.slice(0, 4)])
      }
    }, 1500) // Faster updates for more excitement

    return () => clearInterval(interval)
  }, [])

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch('/api/game/leaderboard')
        const data = await response.json()
        if (data.success) {
          setLeaderboard(data.data.leaderboard)
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      }
    }
    
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Execute trade with enhanced features
  const executeOrder = async (stock: Stock, type: 'buy' | 'sell', amount: number) => {
    try {
      const response = await fetch('/api/game/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          symbol: stock.symbol,
          side: type,
          amount,
          type: 'market'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const trade = result.data.trade
        const rewards = result.data.rewards
        
        // Update local state
        if (type === 'buy') {
          setCash(prev => prev - trade.totalCost)
          setPositions(prev => {
            const existing = prev.find(p => p.symbol === stock.symbol)
            if (existing) {
              const totalShares = existing.shares + trade.shares
              const totalCost = (existing.shares * existing.avgPrice) + trade.totalCost
              const newAvgPrice = totalCost / totalShares
              
              return prev.map(p => 
                p.symbol === stock.symbol 
                  ? { ...p, shares: totalShares, avgPrice: newAvgPrice }
                  : p
              )
            } else {
              return [...prev, {
                symbol: stock.symbol,
                shares: trade.shares,
                avgPrice: trade.executedPrice,
                currentValue: trade.totalCost,
                pnl: 0,
                pnlPercent: 0
              }]
            }
          })
        } else {
          setCash(prev => prev + trade.totalCost)
          setPositions(prev => 
            prev.map(p => 
              p.symbol === stock.symbol 
                ? { ...p, shares: p.shares - trade.shares }
                : p
            ).filter(p => p.shares > 0)
          )
        }
        
        // Update player stats
        setPlayer(prev => ({
          ...prev,
          xp: prev.xp + rewards.xpGained,
          level: rewards.levelUp ? prev.level + 1 : prev.level
        }))
        
        // Show success notification
        setNotifications(prev => [
          `${type.toUpperCase()} executed: ${trade.shares} ${stock.symbol} @ $${trade.executedPrice.toFixed(2)}`,
          ...prev.slice(0, 4)
        ])
        
        // Show achievement notifications
        if (rewards.achievements.length > 0) {
          rewards.achievements.forEach(achievement => {
            setNotifications(prev => [
              `🏆 Achievement unlocked: ${achievement}!`,
              ...prev.slice(0, 4)
            ])
          })
        }
        
        if (rewards.levelUp) {
          setNotifications(prev => [
            `🎉 Level up! You are now level ${player.level + 1}!`,
            ...prev.slice(0, 4)
          ])
        }
        
        setOrderAmount('')
        setSelectedStock(null)
      } else {
        setNotifications(prev => [
          `❌ Trade failed: ${result.error}`,
          ...prev.slice(0, 4)
        ])
      }
    } catch (error) {
      console.error('Trade execution error:', error)
      setNotifications(prev => [
        '❌ Trade failed: Network error',
        ...prev.slice(0, 4)
      ])
    }
  }