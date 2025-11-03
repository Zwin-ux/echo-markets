// Local dev: simple random-walk ticker inserting rows into Supabase `ticks`
// Requires SUPABASE_SERVICE_ROLE_KEY in env (never ship to client)

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('[dev-ticker] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

// Symbols to simulate (keep in sync with lib/config.ts if you change)
const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL']

// Initialize prices with a reasonable base
const state = new Map(
  SYMBOLS.map((s) => [s, 100 + Math.random() * 50])
)

function stepPrice(prev) {
  // Random walk with slight mean reversion
  const drift = -0.02 * (prev - 120) // pull toward 120
  const shock = (Math.random() - 0.5) * 1.2 // volatility
  const next = Math.max(1, prev + drift + shock)
  return Math.round(next * 100) / 100
}

async function tickOnce() {
  const now = new Date()
  const rows = []
  for (const symbol of SYMBOLS) {
    const p = state.get(symbol) || 100
    const next = stepPrice(p)
    state.set(symbol, next)
    rows.push({ symbol, price: next, ts: now.toISOString() })
  }

  const { error } = await supabase.from('ticks').insert(rows)
  if (error) {
    console.error('[dev-ticker] insert error:', error.message)
  } else {
    console.log('[dev-ticker] inserted ticks at', now.toISOString())
  }
}

let timer = null
function start(intervalMs = 2000) {
  console.log('[dev-ticker] starting… interval', intervalMs, 'ms')
  timer = setInterval(tickOnce, intervalMs)
}

function stop() {
  if (timer) clearInterval(timer)
  console.log('[dev-ticker] stopped')
}

process.on('SIGINT', () => { stop(); process.exit(0) })
process.on('SIGTERM', () => { stop(); process.exit(0) })

start(2000)

