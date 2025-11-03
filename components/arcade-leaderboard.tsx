"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, Crown, Star, TrendingUp, Zap, Target,
  Medal, Award, Flame, Users
} from "lucide-react"

interface LeaderboardEntry {
  rank: number
  username: string
  value: number
  change: number
  changePercent: number
  level: number
  achievements: number
  isCurrentUser?: boolean
}

interface ArcadeLeaderboardProps {
  currentUser?: string
}

export default function ArcadeLeaderboard({ currentUser }: ArcadeLeaderboardProps) {
  const [category, setCategory] = useState<'daily' | 'weekly' | 'biggest_gains' | 'highest_level'>('daily')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    // Generate mock leaderboard data based on category
    const generateLeaderboard = (): LeaderboardEntry[] => {
      const usernames = [
        'DiamondHands', 'BullRider99', 'MarketMaster', 'StockNinja', 'WolfOfWallSt',
        'RocketTrader', 'MoneyMaker', 'TradingLegend', 'CryptoKing', 'BearSlayer',
        'QuantKing', 'AlgoTrader', 'ProfitHunter', 'RiskTaker', 'MarketWizard'
      ]

      const entries: LeaderboardEntry[] = []
      
      for (let i = 0; i < 15; i++) {
        const username = usernames[i] || `Trader${i + 1}`
        let value: number
        let change: number
        
        switch (category) {
          case 'daily':
            value = 10000 + (Math.random() - 0.3) * 8000 // $2k - $18k range
            change = value - 10000
            break
          case 'weekly':
            value = 10000 + (Math.random() - 0.2) * 15000 // $-5k - $25k range
            change = value - 10000
            break
          case 'biggest_gains':
            change = Math.random() * 20000 + 1000 // $1k - $21k gains
            value = 10000 + change
            break
          case 'highest_level':
            value = 10000 + Math.random() * 50000 // Higher values for higher levels
            change = value - 10000
            break
          default:
            value = 10000
            change = 0
        }
        
        const changePercent = (change / 10000) * 100
        const level = Math.floor(value / 2000) + 1
        const achievements = Math.floor(Math.random() * 20)
        
        entries.push({
          rank: i + 1,
          username,
          value,
          change,
          changePercent,
          level,
          achievements,
          isCurrentUser: username === currentUser
        })
      }
      
      // Sort based on category
      switch (category) {
        case 'biggest_gains':
          entries.sort((a, b) => b.change - a.change)
          break
        case 'highest_level':
          entries.sort((a, b) => b.level - a.level)
          break
        default:
          entries.sort((a, b) => b.value - a.value)
      }
      
      // Update ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1
      })
      
      return entries
    }

    setLeaderboard(generateLeaderboard())
  }, [category, currentUser])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />
      case 2: return <Medal className="w-5 h-5 text-gray-300" />
      case 3: return <Award className="w-5 h-5 text-orange-400" />
      default: return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400">#{rank}</span>
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'daily': return <Trophy className="w-4 h-4" />
      case 'weekly': return <Star className="w-4 h-4" />
      case 'biggest_gains': return <TrendingUp className="w-4 h-4" />
      case 'highest_level': return <Target className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'daily': return 'Daily Champions'
      case 'weekly': return 'Weekly Leaders'
      case 'biggest_gains': return 'Biggest Gains'
      case 'highest_level': return 'Highest Level'
      default: return 'Leaderboard'
    }
  }

  return (
    <Card className="bg-gray-900/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center">
          {getCategoryIcon(category)}
          <span className="ml-2">{getCategoryTitle(category)}</span>
        </CardTitle>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            size="sm"
            variant={category === 'daily' ? 'default' : 'outline'}
            onClick={() => setCategory('daily')}
            className="text-xs"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Daily
          </Button>
          <Button
            size="sm"
            variant={category === 'weekly' ? 'default' : 'outline'}
            onClick={() => setCategory('weekly')}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            Weekly
          </Button>
          <Button
            size="sm"
            variant={category === 'biggest_gains' ? 'default' : 'outline'}
            onClick={() => setCategory('biggest_gains')}
            className="text-xs"
          >
            <Flame className="w-3 h-3 mr-1" />
            Big Gains
          </Button>
          <Button
            size="sm"
            variant={category === 'highest_level' ? 'default' : 'outline'}
            onClick={() => setCategory('highest_level')}
            className="text-xs"
          >
            <Zap className="w-3 h-3 mr-1" />
            Levels
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto space-y-2">
        {leaderboard.slice(0, 10).map((entry) => (
          <div
            key={entry.username}
            className={`p-3 rounded-lg border transition-all ${
              entry.isCurrentUser 
                ? 'border-cyan-400 bg-cyan-400/10' 
                : 'border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getRankIcon(entry.rank)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      entry.isCurrentUser ? 'text-cyan-400' : 'text-gray-200'
                    }`}>
                      {entry.username}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Lv.{entry.level}
                    </Badge>
                    {entry.achievements > 0 && (
                      <Badge className="text-xs bg-yellow-500/20 text-yellow-400">
                        {entry.achievements} 🏆
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    Portfolio: <span className="text-cyan-400 font-mono">
                      ${entry.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  entry.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {entry.change >= 0 ? '+' : ''}${entry.change.toFixed(0)}
                </div>
                <div className={`text-xs ${
                  entry.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {entry.changePercent >= 0 ? '+' : ''}{entry.changePercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}