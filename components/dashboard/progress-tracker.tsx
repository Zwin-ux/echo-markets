'use client'

import { Progress } from '@/components/ui/progress'
import { usePortfolio } from '@/contexts/portfolio-context'

export function ProgressTracker() {
  const { portfolio } = usePortfolio()
  
  // Calculate daily progress
  const dailyReturn = portfolio.holdings.reduce(
    (sum, holding) => sum + (holding.currentPrice - holding.avgPrice) * holding.shares,
    0
  )
  
  const progressPercent = Math.min(Math.max((dailyReturn / 100) * 100, 0), 100)
  
  return (
    <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold text-green-300">Daily Progress</h3>
        <span className="text-green-400">
          {dailyReturn >= 0 ? '+' : ''}{dailyReturn.toFixed(2)}%
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-2 bg-green-900/30" />
      
      <div className="flex justify-between mt-2 text-xs text-green-500/70">
        <span>Start: $100</span>
        <span>Goal: $200</span>
      </div>
    </div>
  )
}
