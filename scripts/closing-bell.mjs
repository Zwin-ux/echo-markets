// Closing Bell worker: snapshot daily PnL to leaderboards
// Requires service role key. Intended to run on schedule.

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, service)

function today() { return new Date().toISOString().slice(0,10) }

async function latestPrices() {
  const { data, error } = await sb
    .from('ticks')
    .select('symbol, price, ts')
    .order('ts', { ascending: false })
    .limit(1000)
  if (error) throw error
  const m = new Map()
  for (const r of data || []) if (!m.has(r.symbol)) m.set(r.symbol, Number(r.price))
  return m
}

async function run() {
  const day = today()
  const prices = await latestPrices()
  // Get all profiles (proxy for users)
  const { data: profs, error } = await sb.from('profiles').select('user_id')
  if (error) throw error
  for (const p of profs || []) {
    const uid = p.user_id
    // Portfolio and holdings
    const { data: port } = await sb.from('portfolios').select('id, cash').eq('user_id', uid).maybeSingle()
    if (!port) continue
    const { data: holds } = await sb.from('holdings').select('symbol, shares').eq('portfolio_id', port.id)
    let equity = 0
    for (const h of holds || []) equity += Number(h.shares) * (prices.get(h.symbol) || 0)
    const netWorth = Number(port.cash || 0) + equity
  const baseline = Number(process.env.STARTING_CASH || 1000)
  const pnl = Math.round((netWorth - baseline) * 100) / 100 // baseline from env (default $1000)
    // Upsert leaderboard row
    const { error: upErr } = await sb
      .from('leaderboards')
      .upsert({ day, user_id: uid, pnl }, { onConflict: 'day,user_id' })
    if (upErr) console.warn('[closing-bell] upsert error for', uid, upErr.message)
  }
  console.log('[closing-bell] snapshot complete for', day)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(e => { console.error(e); process.exit(1) })
}
