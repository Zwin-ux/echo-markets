"use client"

import { useState, useEffect } from "react"
import { Newspaper, Maximize2, Minimize2, X, RefreshCw, Filter, ThumbsUp, ThumbsDown } from "lucide-react"
import supabase from '@/lib/supabase'
import { useSSE } from '@/lib/use-sse'

type FeedItem =
  | { type: 'trade'; id: string; ts: string; symbol: string; price: number; qty: number; buy_username: string | null; sell_username: string | null }
  | { type: 'event'; id: string; ts: string; symbol: string | null; headline: string; impact_type: 'PUMP'|'DUMP'|'PANIC'|'HYPE'; magnitude: number }

export default function NewsFeedModule() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(false)
  const { lastEvent } = useSSE('/api/feed/stream')

  async function loadFeed() {
    try {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const res = await fetch('/api/feed?limit=100', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const json = await res.json()
      if (res.ok && json?.items) setItems(json.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeed() }, [])

  // Realtime: subscribe to new events and trades
  // Moved fully to enriched SSE; DB channel subscription removed to avoid duplicate rows

  // Merge enriched items from server relay SSE
  useEffect(() => {
    if (!lastEvent) return
    // lastEvent may carry various event types; we only care about trade/event
    const anyEvt: any = lastEvent
    if (anyEvt?.type === 'trade' || anyEvt?.type === 'event') {
      setItems(prev => [anyEvt as FeedItem, ...prev].slice(0, 200))
    }
  }, [lastEvent])

  const filtered = items

  const handleLike = (_id: string) => {}
  const handleDislike = (_id: string) => {}

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Newspaper size={14} className="mr-2" />
          <span className="text-xs font-semibold">NEWS_FEED</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 hover:bg-green-500/20 rounded"
            title="Filter News"
          >
            <Filter size={12} />
          </button>
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

      {showFilters && (
        <div className="flex p-2 border-b border-green-500/30 bg-green-500/5">
          <button
            onClick={() => setActiveFilter(null)}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === null ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("stocks")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "stocks" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setActiveFilter("crypto")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "crypto" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setActiveFilter("economy")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "economy" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Economy
          </button>
          <button
            onClick={() => setActiveFilter("tech")}
            className={`text-xs px-2 py-1 rounded ${
              activeFilter === "tech" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Tech
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-xs text-center py-3 text-green-500/60">Loading…</div>}
        {filtered.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No news matching your filter.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {filtered.map((it) => (
              <div key={it.id} className="p-3 hover:bg-green-500/5">
                {it.type === 'event' ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold">{it.headline}</div>
                      <div className="text-xs text-green-500/70">{it.symbol ? `$${it.symbol}` : 'MARKET'} • {new Date(it.ts).toLocaleTimeString()}</div>
                    </div>
                    <div className={`text-xs px-1.5 py-0.5 rounded ${it.impact_type === 'PUMP' || it.impact_type === 'HYPE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {it.impact_type}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold">
                        {(it.buy_username || 'buyer')} → {(it.sell_username || 'seller')} • {it.qty} ${it.symbol} @ ${it.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-500/70">{new Date(it.ts).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">TRADE</div>
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
