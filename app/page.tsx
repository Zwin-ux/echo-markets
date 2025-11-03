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
import { useModule } from "@/contexts/module-context"
import { PortfolioProvider } from "@/contexts/portfolio-context"
import { UserProvider } from "@/contexts/user-context"
import { ThemeProvider } from "@/components/theme-provider"
import UserProfile from "@/components/user-profile"
import prisma from '@/lib/prisma'
import { useRouter } from 'next/navigation'
import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/hooks/use-toast'
import SignInBox from '@/components/auth/sign-in'
import { getStartingCash } from '@/lib/config'
import QuestWidget from '@/components/quest-widget'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [userLabel, setUserLabel] = useState<string>('')
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)
  const { activeModules } = useModule()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const s = data.session
      setAuthed(!!s)
      if (s?.user) {
        // Try profile username; fall back to email
        try {
          const { data: prof } = await supabase.from('profiles').select('username').eq('user_id', s.user.id).maybeSingle()
          setUserLabel(prof?.username || s.user.email || 'you')
        } catch {
          setUserLabel(s.user.email || 'you')
        }
      } else setUserLabel('')
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setAuthed(!!session)
      if (session?.user) {
        try {
          const { data: prof } = await supabase.from('profiles').select('username').eq('user_id', session.user.id).maybeSingle()
          setUserLabel(prof?.username || session.user.email || 'you')
        } catch {
          setUserLabel(session.user.email || 'you')
        }
      } else setUserLabel('')
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  function handleSignOut() {
    supabase.auth.signOut().then(() => {
      toast({
        title: 'Signed out',
        description: 'Come back anytime.',
        action: <ToastAction altText="Sign in" onClick={() => router.push('/')}>Sign in</ToastAction>,
      })
    })
  }

  useEffect(() => {
    console.log('Active modules:', activeModules)
  }, [activeModules])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
              <main className="flex flex-col h-screen bg-black text-green-400 font-mono overflow-hidden">
                {authed === false && (
                  <div className="flex-1 grid grid-cols-3 gap-3 p-6">
                    <div className="col-span-2 panel p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Echo Markets</h2>
                        <a href="/onboarding" className="text-xs underline">Tour</a>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="panel p-4">
                          <div className="text-sm font-semibold mb-3">Sign in</div>
                          <SignInBox />
                          <div className="text-[10px] text-green-500/60 mt-2">We send a one‑time link — no password.</div>
                        </div>
                        <div className="panel p-4">
                          <div className="text-sm font-semibold mb-2">Quick facts</div>
                          <ul className="text-xs text-green-200 space-y-2">
                            <li>• Daily ${getStartingCash()} reset</li>
                            <li>• Live public feed</li>
                            <li>• Narrative events</li>
                          </ul>
                          <a href="/?all=1" className="btn-hud mt-3 inline-block">Explore UI</a>
                        </div>
                      </div>
                    </div>
                    <div className="panel p-4">
                      <div className="text-xs text-green-300">Sign in to start trading.</div>
                    </div>
                  </div>
                )}
                <header className="border-b border-green-500/30 p-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold tracking-tighter mr-2">
                      <span className="text-green-400">ECHO</span>
                      <span className="text-pink-500">_</span>
                      <span className="text-blue-400">MARKETS</span>
                    </h1>
                    <div className="text-xs text-green-500/70">v0.2.0_beta</div>
                  </div>
                  <div className="flex space-x-3 text-xs items-center">
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      S&P 500: <span className="text-red-400">-1.2%</span>
                    </div>
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      BTC: <span className="text-green-400">+3.4%</span>
                    </div>
                    <div className="px-2 py-1 bg-green-500/10 rounded-sm">
                      DRAMA SCORE: <span className="text-yellow-400">HIGH</span>
                    </div>
                    {authed && <QuestWidget />}
                    {authed ? (
                      <>
                        <div className="px-2 py-1 bg-green-500/10 rounded border border-green-500/30 text-green-300">{userLabel}</div>
                        <button
                          onClick={() => setShowProfile(!showProfile)}
                          className="px-2 py-1 bg-blue-500/20 rounded-sm hover:bg-blue-500/30"
                        >
                          PROFILE
                        </button>
                        <button onClick={handleSignOut} className="btn-hud">Sign out</button>
                      </>
                    ) : (
                      <a href="/" className="btn-hud">Sign in</a>
                    )}
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
    </ThemeProvider>
  )
}
