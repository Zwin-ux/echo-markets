"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, TrendingDown, PieChart, BarChart3, 
  Star, Award, Target, Zap, Crown, Trophy
} from "lucide-react"

interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercent: number
  allocation: number
}

interface PortfolioStats {
  totalValue: number
  dayChange: number
  dayChangePercent: number
  bestTrade: string
  worstTrade: string
  winRate: number
  totalTrades: number
  level: number
  xp: number
  nextLevelXP: number
  achievements: string[]
  rank: number
}

interface PortfolioShowcaseProps {
  positions: Position[]
  stats: PortfolioStats
  username: string
}

export default function PortfolioShowcase({ positions, stats, username }: PortfolioShowcaseProps) {
  const [view, setView] = useState<'positions' | 'performance' | 'achievements'>('positions')

  const getPerformanceColor = (percent: number) => {
    if (percent > 20) return 'text-green-400'
    if (percent > 5) return 'text-green-300'
    if (percent > 0) return 'text-green-200'
    if (percent > -5) return 'text-red-200'
    if (percent > -20) return 'text-red-300'
    return 'text-red-400'
  }

  const getPerformanceBadge = (percent: number) => {
    if (percent > 50) return { text: 'LEGENDARY', color: 'bg-purple-500/20 text-purple-400' }
    if (percent > 25) return { text: 'EXCELLENT', color: 'bg-green-500/20 text-green-400' }
    if (percent > 10) return { text: 'GOOD', color: 'bg-blue-500/20 text-blue-400' }
    if (percent > 0) return { text: 'POSITIVE', color: 'bg-cyan-500/20 text-cyan-400' }
    if (percent > -10) return { text: 'STRUGGLING', color: 'bg-yellow-500/20 text-yellow-400' }
    return { text: 'DANGER', color: 'bg-red-500/20 text-red-400' }
  }

  const performanceBadge = getPerformanceBadge(stats.dayChangePercent)

  return (
    <Card className="bg-gray-900/50 border-cyan-500/30">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-cyan-400 flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              {username}'s Portfolio
            </CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className="bg-cyan-500/20 text-cyan-400">
                Rank #{stats.rank}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-400">
                Level {stats.level}
              </Badge>
              <Badge className={performanceBadge.color}>
                {performanceBadge.text}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">
              ${stats.totalValue.toLocaleString()}
            </div>
            <div className={`text-sm ${getPerformanceColor(stats.dayChangePercent)}`}>
              {stats.dayChange >= 0 ? '+' : ''}${stats.dayChange.toFixed(0)} 
              ({stats.dayChangePercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Level {stats.level} Progress</span>
            <span>{stats.xp}/{stats.nextLevelXP} XP</span>
          </div>
          <Progress 
            value={(stats.xp / stats.nextLevelXP) * 100} 
            className="h-2 bg-gray-800"
          />
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            size="sm"
            variant={view === 'positions' ? 'default' : 'outline'}
            onClick={() => setView('positions')}
            className="text-xs"
          >
            <PieChart className="w-3 h-3 mr-1" />
            Positions
          </Button>
          <Button
            size="sm"
            variant={view === 'performance' ? 'default' : 'outline'}
            onClick={() => setView('performance')}
            className="text-xs"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Stats
          </Button>
          <Button
            size="sm"
            variant={view === 'achievements' ? 'default' : 'outline'}
            onClick={() => setView('achievements')}
            className="text-xs"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Achievements
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {view === 'positions' && (
          <div className="space-y-3">
            {positions.length > 0 ? positions.map((position) => (
              <div key={position.symbol} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-cyan-400">{position.symbol}</div>
                    <div className="text-xs text-gray-400">
                      {position.shares} shares @ ${position.avgPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {position.allocation.toFixed(1)}% of portfolio
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-cyan-400">
                      ${position.value.toLocaleString()}
                    </div>
                    <div className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(0)}
                    </div>
                    <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-8">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No positions yet</p>
                <p className="text-xs">Start trading to build your portfolio!</p>
              </div>
            )}
          </div>
        )}
        
        {view === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {stats.winRate.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {stats.totalTrades}
                </div>
                <div className="text-xs text-gray-400">Total Trades</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                <span className="text-sm text-gray-300">Best Trade</span>
                <span className="text-sm text-green-400 font-semibold">{stats.bestTrade}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-500/10 rounded">
                <span className="text-sm text-gray-300">Worst Trade</span>
                <span className="text-sm text-red-400 font-semibold">{stats.worstTrade}</span>
              </div>
            </div>
          </div>
        )}
        
        {view === 'achievements' && (
          <div className="space-y-3">
            {stats.achievements.length > 0 ? stats.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-semibold text-yellow-400">{achievement}</div>
                  <div className="text-xs text-gray-400">Recently unlocked</div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-8">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No achievements yet</p>
                <p className="text-xs">Keep trading to unlock rewards!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}