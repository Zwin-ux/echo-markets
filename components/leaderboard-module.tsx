"use client"

import { useState, useEffect } from "react"
import { Trophy, Maximize2, Minimize2, X, RefreshCw, Search } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useUserStats } from '@/contexts/user-stats-context'
import { useModule } from '@/contexts/module-context'
import { useGameEngine } from '@/contexts/game-engine-context'
import { toast } from '@/hooks/use-toast'

type LeaderboardEntry = {
  rank: number
  username: string
  avatar: string
  returns: number
  trades: number
  winRate: number
  badges: string[]
}

export default function LeaderboardModule() {
  const { subscribe } = useGameEngine();
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeTab, setActiveTab] = useState<"returns" | "trades" | "winRate">("returns")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useUser()
  const { stats } = useUserStats()
  const { activeModules } = useModule()
  const isVisible = activeModules.includes('leaderboard')

  // Listen for tick and progression/achievement events
  useEffect(() => {
    const listener = (event: any) => {
      if (event.type === 'tick') {
        // Could refresh leaderboard data here
        console.log('Leaderboard tick update!')
      }
      if (event.type === 'achievement') {
        toast({
          title: `Leaderboard: Achievement unlocked!`,
          description: event.payload.name,
        })
      }
      if (event.type === 'player_level_up') {
        toast({
          title: `Leaderboard: Level Up!`,
          description: `Level ${event.payload.level}`,
        })
      }
      if (event.type === 'xp_gain') {
        toast({
          title: `Leaderboard: XP Gained`,
          description: `+${event.payload.amount} XP`,
        })
      }
      if (event.type === 'milestone') {
        toast({
          title: `Leaderboard: Milestone`,
          description: event.payload.name,
        })
      }
    }
    const unsubscribe = subscribe(listener)
    return () => unsubscribe()
  }, [subscribe])

  if (!isVisible) return null

  // Mock leaderboard data
  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      username: "diamond_hands",
      avatar: "💎",
      returns: 87.4,
      trades: 142,
      winRate: 68,
      badges: ["Whale", "OG Trader"],
    },
    {
      rank: 2,
      username: "moon_boi",
      avatar: "🌕",
      returns: 62.1,
      trades: 87,
      winRate: 65,
      badges: ["Meme Lord"],
    },
    {
      rank: 3,
      username: "satoshi_jr",
      avatar: "₿",
      returns: 58.9,
      trades: 56,
      winRate: 71,
      badges: ["Crypto King"],
    },
    {
      rank: 4,
      username: "stonks_only_up",
      avatar: "📈",
      returns: 45.2,
      trades: 210,
      winRate: 59,
      badges: ["Volume King"],
    },
    {
      rank: 5,
      username: "bear_market_survivor",
      avatar: "🐻",
      returns: 38.7,
      trades: 94,
      winRate: 62,
      badges: ["Recession Proof"],
    },
    {
      rank: 0, // Will be calculated
      username: user.username,
      avatar: user.avatar,
      returns: stats.dailyReturn,
      trades: stats.tradesToday,
      winRate: stats.winRate,
      badges: stats.badges
    },
    {
      rank: 7,
      username: "algo_trader",
      avatar: "🤖",
      returns: 29.8,
      trades: 312,
      winRate: 54,
      badges: ["Bot Master"],
    },
    {
      rank: 8,
      username: "buy_high_sell_low",
      avatar: "🤡",
      returns: 24.3,
      trades: 78,
      winRate: 51,
      badges: ["Comeback Kid"],
    },
  ]

  // Sort based on active tab
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (activeTab === "returns") return b.returns - a.returns
    if (activeTab === "trades") return b.trades - a.trades
    return b.winRate - a.winRate
  })

  // Update rank
  sortedData.forEach((entry, index) => {
    entry.rank = index + 1
  })

  // Apply search filter
  const filteredData = searchQuery
    ? sortedData.filter(
        (entry) =>
          entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.badges.some((badge) => badge.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : sortedData

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Trophy size={14} className="mr-2" />
          <span className="text-xs font-semibold">LEADERBOARD</span>
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

      <div className="p-2 border-b border-green-500/30 flex">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1.5 text-green-500/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search traders..."
            className="w-full bg-black border border-green-500/30 rounded pl-7 pr-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="flex border-b border-green-500/30">
        <button
          onClick={() => setActiveTab("returns")}
          className={`flex-1 py-2 text-xs font-semibold ${
            activeTab === "returns" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          RETURNS
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`flex-1 py-2 text-xs font-semibold ${
            activeTab === "trades" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          TRADES
        </button>
        <button
          onClick={() => setActiveTab("winRate")}
          className={`flex-1 py-2 text-xs font-semibold ${
            activeTab === "winRate" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          WIN RATE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredData.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No traders found matching your search.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {filteredData.map((entry) => (
              <div
                key={entry.username}
                className={`p-2 hover:bg-green-500/5 ${entry.username === user.username ? "bg-blue-500/10" : ""}`}
              >
                <div className="flex items-center mb-1">
                  <div className="w-6 text-center text-xs font-bold text-green-500/70">#{entry.rank}</div>
                  <div className="mr-2">{entry.avatar}</div>
                  <div className="font-bold text-sm">{entry.username}</div>
                  {entry.username === user.username && (
                    <div className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">YOU</div>
                  )}
                </div>

                <div className="flex ml-6 text-xs">
                  <div className="mr-3">
                    <span className="text-green-500/70">Returns:</span> {entry.returns > 0 ? "+" : ""}
                    {entry.returns}%
                  </div>
                  <div className="mr-3">
                    <span className="text-green-500/70">Trades:</span> {entry.trades}
                  </div>
                  <div>
                    <span className="text-green-500/70">Win Rate:</span> {entry.winRate}%
                  </div>
                </div>

                {entry.badges.length > 0 && (
                  <div className="ml-6 mt-1 flex flex-wrap">
                    {entry.badges.map((badge, i) => (
                      <div key={i} className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded mr-1 mb-1">
                        {badge}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
