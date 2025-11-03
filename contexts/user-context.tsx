"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { User, AuthSession, ensureAuthSession, logout as authLogout } from "@/lib/auth"

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

type UserContextType = {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  isGuest: boolean
  stats: UserStats
  settings: UserSettings
  updateUsername: (username: string) => void
  updateAvatar: (avatar: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  incrementTrades: () => void
  addXP: (amount: number) => void
  addBadge: (badge: string) => void
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    trades: 0,
    winRate: 0,
    avgReturn: 0,
    bestTrade: 0,
    worstTrade: 0,
    level: 1,
    xp: 0,
    badges: [],
  })
  const [settings, setSettings] = useState<UserSettings>({
    theme: "default",
    notifications: true,
    soundEffects: true,
    autoRefresh: true,
    refreshInterval: 60,
  })

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const newSession = await ensureAuthSession()
      setSession(newSession)
      
      // Load user stats and settings from preferences
      if (newSession?.user.preferences) {
        const prefs = newSession.user.preferences as any
        if (prefs.stats) setStats(prefs.stats)
        if (prefs.settings) setSettings(prefs.settings)
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const updateUsername = (username: string) => {
    if (!session) return
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, username, display_name: username }
    } : null)
  }

  const updateAvatar = (avatar: string) => {
    if (!session) return
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, avatar_url: avatar }
    } : null)
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    // TODO: Persist to user preferences API
  }

  const incrementTrades = () => {
    setStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
    }))
  }

  const addXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.xp + amount
      const xpPerLevel = 100
      const newLevel = Math.floor(newXP / xpPerLevel) + 1

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      }
    })
  }

  const addBadge = (badge: string) => {
    setStats(prev => {
      if (prev.badges.includes(badge)) return prev

      return {
        ...prev,
        badges: [...prev.badges, badge],
      }
    })
  }

  const logout = async () => {
    try {
      await authLogout()
      setSession(null)
      setStats({
        trades: 0,
        winRate: 0,
        avgReturn: 0,
        bestTrade: 0,
        worstTrade: 0,
        level: 1,
        xp: 0,
        badges: [],
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: session?.user || null,
        session,
        isLoading,
        isGuest: session?.user?.is_guest || false,
        stats,
        settings,
        updateUsername,
        updateAvatar,
        updateSettings,
        incrementTrades,
        addXP,
        addBadge,
        logout,
        refreshSession,
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
