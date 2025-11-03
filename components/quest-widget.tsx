"use client"

import { useEffect, useRef, useState } from 'react'
// Removed deprecated supabase import
import { toast } from '@/hooks/use-toast'

type Quest = { day: string; goal_pnl: number; progress_pnl: number; done: boolean }

export default function QuestWidget() {
  const [quest, setQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const prevDone = useRef<boolean | null>(null)

  async function load() {
    try {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const res = await fetch('/api/quest', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const json = await res.json()
      if (res.ok && json?.quest) setQuest(json.quest)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  // Toast when quest first completes
  useEffect(() => {
    if (quest) {
      if (prevDone.current === false && quest.done === true) {
        toast({ title: 'Daily Quest complete', description: 'Nice work. Check the leaderboard at close.' })
      }
      if (prevDone.current === null) prevDone.current = quest.done
      else prevDone.current = quest.done
    }
  }, [quest])

  const pct = quest ? Math.min(100, Math.round((quest.progress_pnl / Math.max(1, quest.goal_pnl)) * 100)) : 0

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="text-green-400">Daily Quest</div>
      <div className="w-28 h-3 bg-green-500/10 border border-green-500/30 rounded overflow-hidden">
        <div className={`h-full ${quest?.done ? 'bg-green-500/80' : 'bg-green-500/40'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-green-300 tabular-nums">${quest?.progress_pnl?.toFixed?.(2) ?? (loading ? '…' : '0.00')} / ${quest?.goal_pnl ?? 10}</div>
      {quest?.done && <div className="ml-1 text-green-400">✓</div>}
    </div>
  )
}
