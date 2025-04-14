"use client"

import { useState, useEffect } from "react"
import Terminal from "@/components/terminal"
import Sidebar from "@/components/sidebar"
import ChartModule from "@/components/chart-module"
import NarratorModule from "@/components/market-narrator" // Fix market-narrator import path
import SimulationModule from "@/components/simulation-module"
import PortfolioModule from "@/components/portfolio-module"
import NewsFeedModule from "@/components/news-feed-module"
import TradingModule from "@/components/trading-module"
import LeaderboardModule from "@/components/leaderboard-module"
import { CommandProvider } from "@/contexts/command-context"
import { ModuleProvider, useModule } from "@/contexts/module-context"
import { PortfolioProvider } from "@/contexts/portfolio-context"
import { UserProvider } from "@/contexts/user-context"
import { ThemeProvider } from "@/components/theme-provider"
import UserProfile from "@/components/user-profile"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { activeModules } = useModule()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log('Active modules:', activeModules)
  }, [activeModules])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <UserProvider>
        <PortfolioProvider>
          <CommandProvider>
            <ModuleProvider>
              <main className="flex flex-col h-screen bg-black text-green-400 font-mono overflow-hidden">
                <header className="border-b border-green-500/30 p-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold tracking-tighter mr-2">
                      <span className="text-green-400">ECHO</span>
                      <span className="text-pink-500">_</span>
                      <span className="text-blue-400">MARKETS</span>
                    </h1>
                    <div className="text-xs text-green-500/70">v0.2.0_beta</div>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      S&P 500: <span className="text-red-400">-1.2%</span>
                    </div>
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      BTC: <span className="text-green-400">+3.4%</span>
                    </div>
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      DRAMA SCORE: <span className="text-yellow-400">HIGH</span>
                    </div>
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="px-2 py-1 bg-blue-500/20 rounded-sm hover:bg-blue-500/30"
                    >
                      PROFILE
                    </button>
                  </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />

                  <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1 p-1 overflow-hidden">
                    {activeModules.includes('terminal') && <Terminal />}
                    {activeModules.includes('charts') && <ChartModule />}
                    {activeModules.includes('news') && <NewsFeedModule />}
                    {activeModules.includes('portfolio') && <PortfolioModule />}
                    {activeModules.includes('trading') && <TradingModule />}
                    {activeModules.includes('leaderboard') && <LeaderboardModule />}
                    {activeModules.includes('narrator') && (
                      <div className="col-span-3 row-span-2">
                        <NarratorModule />
                      </div>
                    )}
                    {activeModules.includes('simulation') && <SimulationModule />}
                  </div>
                </div>

                <footer className="border-t border-green-500/30 p-1 text-xs text-green-500/70 flex justify-between">
                  <div>
                    Press <kbd className="bg-green-500/20 px-1 rounded">?</kbd> for keyboard shortcuts
                  </div>
                  <div>ECHO_MARKETS &copy; {new Date().getFullYear()} | The rebellion is data-driven</div>
                </footer>

                {showProfile && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <UserProfile onClose={() => setShowProfile(false)} />
                  </div>
                )}
              </main>
            </ModuleProvider>
          </CommandProvider>
        </PortfolioProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
