// Narrator generator (v0.3): creates short narrative lines from recent trades/events
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, service)

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function fetchSnapshot() {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString() // last hour
  const [tradesRes, eventsRes] = await Promise.all([
    sb.from('trades').select('symbol, price, qty, buy_user, sell_user, executed_at').gt('executed_at', since).order('executed_at', { ascending: false }).limit(300),
    sb.from('events').select('symbol, impact_type, magnitude, created_at').gt('created_at', since).order('created_at', { ascending: false }).limit(100),
  ])
  return { trades: tradesRes.data || [], events: eventsRes.data || [] }
}

function generateNarrativeSummary(trades, events) {
  const volumes = new Map()
  for (const t of trades) volumes.set(t.symbol, (volumes.get(t.symbol) || 0) + Number(t.qty || 0))
  const top = Array.from(volumes.entries()).sort((a,b) => b[1]-a[1]).map(([s])=>s)
  const ev = events.slice(0,5)
  const pumps = ev.filter(e => e.impact_type === 'PUMP').map(e => e.symbol).filter(Boolean)
  const dumps = ev.filter(e => e.impact_type === 'DUMP' || e.impact_type === 'PANIC').map(e => e.symbol).filter(Boolean)
  const up = pumps.length ? `$${pick(pumps)}` : (top[0] ? `$${top[0]}` : 'the market')
  const down = dumps.length ? `$${pick(dumps)}` : (top[1] ? `$${top[1]}` : 'risk-on names')
  const verbs = ['rotated out of','fled','piled into','whipsawed','churned']
  const sentence = `Whales ${pick(verbs)} ${down} while momentum chased ${up}.`
  return sentence
}

async function runOnce() {
  const snap = await fetchSnapshot()
  const text = generateNarrativeSummary(snap.trades, snap.events)
  await sb.from('narratives').insert({ text })
  console.log('[narrator] inserted:', text)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOnce().catch(e => { console.error(e); process.exit(1) })
}

