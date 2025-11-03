/**
 * Echo Markets Beta Landing Page
 * Showcases the new Dynamic Market Engine and features
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Users, Zap, BarChart3 } from "lucide-react"

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface MarketState {
  isOpen: boolean
  dramaScore: number
  volatilityRegime: string
  marketTrend: string
}

export default function BetaPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [marketState, setMarketState] = useState<MarketState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState(42) // Mock for now

  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market/state')
      const data = await response.json()
      
      if (data.success) {
        setMarketData(data.data.prices || [])
        setMarketState(data.data.marketState)
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDramaColor = (score: number) => {
    if (score < 25) return 'text-green-400'
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
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-500/30 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-green-400">ECHO</span>
              <span className="text-pink-500">_</span>
              <span className="text-blue-400">MARKETS</span>
            </h1>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              BETA
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <Users className="inline w-4 h-4 mr-1" />
              {activeUsers} traders online
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
            >
              START TRADING
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            The Future of <span className="text-blue-400">Virtual Trading</span>
          </h2>
          <p className="text-xl text-green-300 mb-8 max-w-3xl mx-auto">
            Experience realistic market simulation powered by advanced algorithms. 
            Trade with $10,000 virtual cash, compete on leaderboards, and master the markets.
          </p>
          
          {/* Live Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold text-green-400">
                  {marketState ? getDramaLabel(marketState.dramaScore) : 'LOADING'}
                </div>
                <div className="text-sm text-green-300">Drama Score</div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-blue-400">
                  {marketState?.volatilityRegime.toUpperCase() || 'NORMAL'}
                </div>
                <div className="text-sm text-blue-300">Volatility</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-purple-400">
                  {marketState?.isOpen ? 'OPEN' : 'CLOSED'}
                </div>
                <div className="text-sm text-purple-300">Market Status</div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold text-yellow-400">{activeUsers}</div>
                <div className="text-sm text-yellow-300">Active Traders</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Market Data */}
      <section className="py-8 px-4 bg-green-500/5">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Live Market Data</h3>
          
          {loading ? (
            <div className="text-center text-green-300">Loading market data...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {marketData.map((stock) => (
                <Card key={stock.symbol} className="bg-black/50 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-400 mb-1">
                      {stock.symbol}
                    </div>
                    <div className="text-xl font-mono mb-2">
                      ${stock.price?.toFixed(2) || '0.00'}
                    </div>
                    <div className={`flex items-center justify-center text-sm ${
                      (stock.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(stock.changePercent || 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {stock.changePercent?.toFixed(2) || '0.00'}%
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold mb-12 text-center">Beta Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400">🎯 Realistic Trading</CardTitle>
                <CardDescription className="text-green-300">
                  Advanced market simulation using Geometric Brownian Motion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-green-200 space-y-2">
                  <li>• $10,000 starting capital</li>
                  <li>• Real-time price updates</li>
                  <li>• Market & limit orders</li>
                  <li>• Bid-ask spreads</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400">📈 Dynamic Markets</CardTitle>
                <CardDescription className="text-blue-300">
                  AI-powered market events and volatility modeling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li>• Earnings announcements</li>
                  <li>• Breaking news events</li>
                  <li>• Sector rotations</li>
                  <li>• Volatility spikes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">🏆 Competition</CardTitle>
                <CardDescription className="text-purple-300">
                  Leaderboards and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-purple-200 space-y-2">
                  <li>• Daily leaderboards</li>
                  <li>• Performance metrics</li>
                  <li>• Trading history</li>
                  <li>• Achievement system</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400">⚡ Real-time Updates</CardTitle>
                <CardDescription className="text-yellow-300">
                  Live market data and instant trade execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-yellow-200 space-y-2">
                  <li>• WebSocket connections</li>
                  <li>• Instant order fills</li>
                  <li>• Live portfolio updates</li>
                  <li>• Market event feeds</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">🎮 Gamification</CardTitle>
                <CardDescription className="text-red-300">
                  Engaging gameplay elements and social features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-red-200 space-y-2">
                  <li>• Drama score system</li>
                  <li>• Quest challenges</li>
                  <li>• Social trading feed</li>
                  <li>• Narrative events</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-cyan-500/10 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">🔧 Developer Tools</CardTitle>
                <CardDescription className="text-cyan-300">
                  Built for extensibility and customization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-cyan-200 space-y-2">
                  <li>• Modular architecture</li>
                  <li>• REST API access</li>
                  <li>• Real-time WebSockets</li>
                  <li>• Open source ready</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Trade?</h3>
          <p className="text-xl text-green-300 mb-8">
            Join the beta and experience the future of virtual trading. 
            No real money at risk - just pure trading skill.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/'}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-3"
            >
              START TRADING NOW
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/api/health'}
              className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-3"
            >
              VIEW SYSTEM STATUS
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-green-400">
            <p>🚀 Beta Version • Real-time Market Simulation • No Registration Required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/30 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-green-500/70">
          <p>&copy; 2024 Echo Markets Beta. Built with Next.js, PostgreSQL, and Redis.</p>
          <p className="mt-2 text-xs">
            Market data is simulated. No real financial instruments are traded.
          </p>
        </div>
      </footer>
    </div>
  )
}