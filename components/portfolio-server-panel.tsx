"use client"

import { useEffect, useState } from 'react'
// Removed deprecated supabase import

type ServerPosition = {
  symbol: string
  shares: number
  avg_cost: number
  current_price: number
  unrealized_pnl: number
}

type ServerPortfolio = {
  balance: number
  positions: ServerPosition[]
}

export default function PortfolioServerPanel() {
  const [data, setData] = useState<ServerPortfolio | null>(null)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const res = await fetch('/api/portfolio', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch server portfolio')
        if (mounted) {
          setData(json as ServerPortfolio)
          if (json?.portfolio_id) setPortfolioId(json.portfolio_id)
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to fetch server portfolio')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Realtime: refresh on portfolio/holdings changes
  useEffect(() => {
    let ch: any
    (async () => {
      const { data: userRes } = await supabase.auth.getUser()
      const uid = userRes?.user?.id
      if (!uid) return
      ch = supabase.channel('portfolio_server_panel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios', filter: `user_id=eq.${uid}` }, () => {
          // small debounce via timeout
          setTimeout(() => { void refresh() }, 100)
        })
        .subscribe()
    })()
    async function refresh() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const res = await fetch('/api/portfolio', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        const json = await res.json()
        if (res.ok) {
          setData(json as ServerPortfolio)
          if (json?.portfolio_id) setPortfolioId(json.portfolio_id)
        }
      } catch {}
    }
    return () => { if (ch) supabase.removeChannel(ch) }
  }, [])

  // Holdings channel when we know portfolio id
  useEffect(() => {
    if (!portfolioId) return
    const ch = supabase.channel('holdings_server_panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings', filter: `portfolio_id=eq.${portfolioId}` }, () => {
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData.session?.access_token
          const res = await fetch('/api/portfolio', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          const json = await res.json()
          if (res.ok) setData(json as ServerPortfolio)
        }, 100)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [portfolioId])

  return (
    <div className="mt-3 bg-green-500/5 p-3 rounded border border-green-500/20">
      <div className="text-xs font-bold mb-2">SERVER PORTFOLIO</div>
      {loading && <div className="animate-pulse text-xs text-green-500/70">Loading…</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}
      {data && (
        <>
          <div className="flex justify-between text-sm mb-2">
            <div>Cash</div>
            <div className="font-medium">${data.balance.toFixed(2)}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-green-500/20 bg-black rounded">
              <thead className="bg-green-900/10">
                <tr>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Shares</th>
                  <th className="p-2">Avg Cost</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-2 text-green-500/50">No positions</td></tr>
                )}
                {data.positions.map((p, i) => (
                  <tr key={i}>
                    <td className="p-2 font-mono">{p.symbol}</td>
                    <td className="p-2">{p.shares}</td>
                    <td className="p-2">${p.avg_cost.toFixed(2)}</td>
                    <td className="p-2">${p.current_price.toFixed(2)}</td>
                    <td className={`p-2 ${p.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.unrealized_pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
