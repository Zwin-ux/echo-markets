'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type UserStats = {
  dailyReturn: number
  weeklyReturn: number
  tradesToday: number
  winRate: number
  badges: string[]
}

type UserStatsContextType = {
  stats: UserStats
  updateDailyReturn: (amount: number) => void
  incrementTrades: () => void
  addBadge: (badge: string) => void
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined)

export function UserStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats>(() => {
    const savedStats = typeof window !== 'undefined' ? localStorage.getItem('userStats') : null
    return savedStats 
      ? JSON.parse(savedStats) 
      : {
          dailyReturn: 0,
          weeklyReturn: 0,
          tradesToday: 0,
          winRate: 0,
          badges: []
        }
  })

  const updateDailyReturn = (amount: number) => {
    setStats(prev => ({
      ...prev,
      dailyReturn: prev.dailyReturn + amount,
      weeklyReturn: prev.weeklyReturn + amount
    }))
  }

  const incrementTrades = () => {
    setStats(prev => ({
      ...prev,
      tradesToday: prev.tradesToday + 1
    }))
  }

  const addBadge = (badge: string) => {
    if (!stats.badges.includes(badge)) {
      setStats(prev => ({
        ...prev,
        badges: [...prev.badges, badge]
      }))
    }
  }

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userStats', JSON.stringify(stats))
    }
  }, [stats])

  // Daily reset
  useEffect(() => {
    const today = new Date().toDateString()
    const lastUpdated = typeof window !== 'undefined' ? localStorage.getItem('statsLastUpdated') : null
    
    if (lastUpdated !== today) {
      setStats(prev => ({
        ...prev,
        dailyReturn: 0,
        tradesToday: 0
      }))
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('statsLastUpdated', today)
      }
    }
  }, [])

  return (
    <UserStatsContext.Provider value={{ stats, updateDailyReturn, incrementTrades, addBadge }}>
      {children}
    </UserStatsContext.Provider>
  )
}

export function useUserStats() {
  const context = useContext(UserStatsContext)
  if (context === undefined) {
    throw new Error('useUserStats must be used within a UserStatsProvider')
  }
  return context
}
