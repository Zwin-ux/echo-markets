"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Maximize2, Minimize2, X, RefreshCw, Download } from "lucide-react"
// Removed deprecated supabase import

export default function NarratorModule() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [lines, setLines] = useState<{ id: string | number; text: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const res = await fetch('/api/narrator?limit=50', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const json = await res.json()
      if (res.ok && json?.narratives) setLines(json.narratives)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Realtime: append new narrative lines as they are inserted
  useEffect(() => {
    const ch = supabase
      .channel('narratives_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'narratives' }, (payload: any) => {
        const r = payload.new
        setLines((prev) => [{ id: r.id, text: r.text, created_at: r.created_at }, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'narratives' }, (payload: any) => {
        const r = payload.new
        setLines(prev => prev.map(l => (l.id === r.id ? { id: r.id, text: r.text, created_at: r.created_at } : l)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'narratives' }, (payload: any) => {
        const r = payload.old
        setLines(prev => prev.filter(l => l.id !== r.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const handleDownload = () => {
    const content = lines.map(l => `- ${new Date(l.created_at).toLocaleString()} — ${l.text}`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'market-narrative.txt'
    a.click()
  }

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <MessageSquare size={14} className="mr-2" />
          <span className="text-xs font-semibold">MARKET_NARRATOR</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={load} className="p-1 hover:bg-green-500/20 rounded">
            <RefreshCw size={12} />
          </button>
          <button onClick={handleDownload} className="p-1 hover:bg-green-500/20 rounded">
            <Download size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto narrator-content">
        {loading && <div className="text-xs text-green-500/60">Loading…</div>}
        {lines.map((l) => (
          <div key={l.id} className="mb-2">
            <div className="text-xs text-green-500/60">{new Date(l.created_at).toLocaleString()}</div>
            <div className="text-sm bg-green-500/5 p-2 rounded border border-green-500/20">{l.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
