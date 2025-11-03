"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, TrendingDown, Trophy, Fire, Zap, 
  ArrowUp, ArrowDown, Users, Star, Crown, Award
} from "lucide-react"

interface TradeActivity {
  id: string
  username: string
  action: 'buy' | 'sell'
  symbol: string
  amount: number
  price: number
  profit?: number
  profitPercent?: number
  timestamp: Date
  isHighlight: boolean
  achievement?: string
  level?: number
}

interface SocialFeedProps {
  currentUser?: string
}

export default function SocialFeed({ currentUser }: SocialFeedProps) {
  const [activities, setActivities] = useState<TradeActivity[]>([])
  const [filter, setFilter] = useState<'all' | 'big_wins' | 'big_losses' | 'achievements'>('all')

  // Simulate real-time feed updates
  useEffect(() => {
    const generateActivity = (): TradeActivity => {
      const usernames = [
        'DiamondHands', 'BullRider99', 'MarketMaster', 'StockNinja', 'WolfOfWallSt',
        'RocketTrader', 'MoneyMaker', 'TradingLegend', 'CryptoKing', 'BearSlayer'
      ]
      const symbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL']
      const actions = ['buy', 'sell'] as const
      
      const username = usernames[Math.floor(Math.random() * usernames.length)]
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const amount = Math.floor(Math.random() * 5000) + 100
      const price = Math.random() * 500 + 50
      
      // Generate some big wins/losses for excitement
      const isBigMove = Math.random() < 0.3
      const profit = isBigMove ? (Math.random() - 0.3) * amount * 2 : (Math.random() - 0.5) * amount * 0.5
      const profitPercent = (profit / amount) * 100
      
      const achievements = [
        'First Million!', 'Diamond Hands', 'Bull Run Master', 'Risk Taker', 
        'Market Genius', 'Lucky Streak', 'Big Winner', 'Comeback King'
      ]
      
      return {
        id: `activity-${Date.now()}-${Math.random()}`,
        username,
        action,
        symbol,
        amount,
        price,
        profit: action === 'sell' ? profit : undefined,
        profitPercent: action === 'sell' ? profitPercent : undefined,
        timestamp: new Date(),
        isHighlight: Math.abs(profitPercent) > 20 || amount > 3000,
        achievement: Math.random() < 0.1 ? achievements[Math.floor(Math.random() * achievements.length)] : undefined,
        level: Math.floor(Math.random() * 50) + 1
      }
    }

    // Add initial activities
    const initialActivities = Array.from({ length: 8 }, generateActivity)
    setActivities(initialActivities)

    // Add new activities periodically
    const interval = setInterval(() => {
      const newActivity = generateActivity()
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]) // Keep last 20
    }, 3000 + Math.random() * 4000) // Random interval 3-7 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'big_wins':
        return activity.profitPercent && activity.profitPercent > 15
      case 'big_losses':
        return activity.profitPercent && activity.profitPercent < -15
      case 'achievements':
        return activity.achievement
      default:
        return true
    }
  })

  const getActivityIcon = (activity: TradeActivity) => {
    if (activity.achievement) return <Award className="w-4 h-4 text-yellow-400" />
    if (activity.profitPercent && activity.profitPercent > 20) return <Fire className="w-4 h-4 text-orange-400" />
    if (activity.profitPercent && activity.profitPercent < -20) return <Zap className="w-4 h-4 text-red-400" />
    if (activity.action === 'buy') return <ArrowUp className="w-4 h-4 text-green-400" />
    return <ArrowDown className="w-4 h-4 text-red-400" />
  }

  const getActivityColor = (activity: TradeActivity) => {
    if (activity.achievement) return 'border-l-yellow-400 bg-yellow-400/5'
    if (activity.profitPercent && activity.profitPercent > 20) return 'border-l-green-400 bg-green-400/5'
    if (activity.profitPercent && activity.profitPercent < -20) return 'border-l-red-400 bg-red-400/5'
    return 'border-l-cyan-400/30 bg-gray-800/30'
  }

  return (
    <Card className="bg-gray-900/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Live Trading Feed
        </CardTitle>
        
        <div className="flex space-x-2 mt-4">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === 'big_wins' ? 'default' : 'outline'}
            onClick={() => setFilter('big_wins')}
            className="text-xs"
          >
            🔥 Big Wins
          </Button>
          <Button
            size="sm"
            variant={filter === 'big_losses' ? 'default' : 'outline'}
            onClick={() => setFilter('big_losses')}
            className="text-xs"
          >
            💥 Big Losses
          </Button>
          <Button
            size="sm"
            variant={filter === 'achievements' ? 'default' : 'outline'}
            onClick={() => setFilter('achievements')}
            className="text-xs"
          >
            🏆 Achievements
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto space-y-3">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity)} transition-all hover:bg-gray-700/30`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getActivityIcon(activity)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-cyan-400">
                      {activity.username}
                    </span>
                    {activity.level && (
                      <Badge variant="outline" className="text-xs">
                        Lv.{activity.level}
                      </Badge>
                    )}
                    {activity.username === currentUser && (
                      <Badge className="text-xs bg-cyan-500/20 text-cyan-400">
                        You
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    {activity.action === 'buy' ? 'Bought' : 'Sold'} {activity.symbol} 
                    <span className="text-cyan-400 font-mono ml-1">
                      ${activity.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  {activity.profit !== undefined && (
                    <div className={`text-sm font-semibold ${
                      activity.profitPercent! > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {activity.profitPercent! > 0 ? '+' : ''}${activity.profit.toFixed(0)} 
                      ({activity.profitPercent!.toFixed(1)}%)
                    </div>
                  )}
                  
                  {activity.achievement && (
                    <div className="text-sm text-yellow-400 font-semibold">
                      🏆 {activity.achievement}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                {activity.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activities match your filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}