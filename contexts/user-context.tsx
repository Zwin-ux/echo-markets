"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type UserStats = {
  trades: number
  winRate: number
  avgReturn: number
  bestTrade: number
  worstTrade: number
  level: number
  xp: number
  badges: string[]
}

type UserSettings = {
  theme: "default" | "synthwave" | "terminal" | "hacker"
  notifications: boolean
  soundEffects: boolean
  autoRefresh: boolean
  refreshInterval: number
}

type User = {
  username: string
  avatar: string
  joinDate: Date
  stats: UserStats
  settings: UserSettings
}

type UserContextType = {
  user: User
  updateUsername: (username: string) => void
  updateAvatar: (avatar: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  incrementTrades: () => void
  addXP: (amount: number) => void
  addBadge: (badge: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({
    username: "anon_trader",
    avatar: "👾",
    joinDate: new Date(),
    stats: {
      trades: 42,
      winRate: 58,
      avgReturn: 7.2,
      bestTrade: 124,
      worstTrade: -35,
      level: 3,
      xp: 320,
      badges: ["Early Adopter", "Diamond Hands"],
    },
    settings: {
      theme: "default",
      notifications: true,
      soundEffects: true,
      autoRefresh: true,
      refreshInterval: 60,
    },
  })

  const updateUsername = (username: string) => {
    setUser((prev) => ({
      ...prev,
      username,
    }))
  }

  const updateAvatar = (avatar: string) => {
    setUser((prev) => ({
      ...prev,
      avatar,
    }))
  }

  const updateSettings = (settings: Partial<UserSettings>) => {
    setUser((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings,
      },
    }))
  }

  const incrementTrades = () => {
    setUser((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        trades: prev.stats.trades + 1,
      },
    }))
  }

  const addXP = (amount: number) => {
    setUser((prev) => {
      const newXP = prev.stats.xp + amount
      const xpPerLevel = 100
      const newLevel = Math.floor(newXP / xpPerLevel) + 1

      return {
        ...prev,
        stats: {
          ...prev.stats,
          xp: newXP,
          level: newLevel,
        },
      }
    })
  }

  const addBadge = (badge: string) => {
    setUser((prev) => {
      if (prev.stats.badges.includes(badge)) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          badges: [...prev.stats.badges, badge],
        },
      }
    })
  }

  return (
    <UserContext.Provider
      value={{
        user,
        updateUsername,
        updateAvatar,
        updateSettings,
        incrementTrades,
        addXP,
        addBadge,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
