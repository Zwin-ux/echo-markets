// Order matching/fulfillment loop for Supabase (MVP)
// Executes open market/limit orders against latest ticks.
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, service)

async function latestPrice(symbol) {
  const { data, error } = await sb
    .from('ticks')
    .select('price, ts')
    .eq('symbol', symbol)
    .order('ts', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return Number(data?.price) || 0
}

async function getOrCreatePortfolio(user_id) {
  const { data, error } = await sb
    .from('portfolios')
    .select('id, cash')
    .eq('user_id', user_id)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data) return data
  const start = Number(process.env.STARTING_CASH || 1000)
  const { data: created, error: createErr } = await sb
    .from('portfolios')
    .insert({ user_id, cash: start })
    .select('id, cash')
    .single()
  if (createErr) throw createErr
  return created
}

async function getHolding(portfolio_id, symbol) {
  const { data, error } = await sb
    .from('holdings')
    .select('id, shares, avg_price')
    .eq('portfolio_id', portfolio_id)
    .eq('symbol', symbol)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data || null
}

async function fillBuy(order, price) {
  const { user_id, symbol, qty } = order
  const portfolio = await getOrCreatePortfolio(user_id)
  const cost = Number(qty) * price
  const cash = Number(portfolio.cash) || 0
  if (cash < cost) return false // insufficient funds; leave open

  // Debit cash
  const { error: cashErr } = await sb.from('portfolios').update({ cash: cash - cost }).eq('id', portfolio.id)
  if (cashErr) throw cashErr

  // Upsert holding
  const existing = await getHolding(portfolio.id, symbol)
  if (existing) {
    const prevShares = Number(existing.shares) || 0
    const prevAvg = Number(existing.avg_price) || 0
    const totalShares = prevShares + Number(qty)
    const totalCost = prevShares * prevAvg + Number(qty) * price
    const newAvg = totalCost / totalShares
    const { error: upErr } = await sb
      .from('holdings')
      .update({ shares: totalShares, avg_price: newAvg })
      .eq('id', existing.id)
    if (upErr) throw upErr
  } else {
    const { error: insErr } = await sb
      .from('holdings')
      .insert({ portfolio_id: portfolio.id, symbol, shares: Number(qty), avg_price: price })
    if (insErr) throw insErr
  }

  // Insert trade (market maker as counterparty)
  const { error: trErr } = await sb
    .from('trades')
    .insert({ symbol, price, qty: Number(qty), buy_user: user_id })
  if (trErr) throw trErr

  // Progression: increment trades_today and small XP
  await bumpProgression(user_id, { realizedPnl: 0, side: 'buy' })

  return true
}

async function fillSell(order, price) {
  const { user_id, symbol, qty } = order
  const portfolio = await getOrCreatePortfolio(user_id)
  const existing = await getHolding(portfolio.id, symbol)
  if (!existing) return false
  const prevShares = Number(existing.shares) || 0
  if (prevShares < Number(qty)) return false // not enough shares; leave open

  const newShares = prevShares - Number(qty)
  const { error: upErr } = await sb
    .from('holdings')
    .update({ shares: newShares })
    .eq('id', existing.id)
  if (upErr) throw upErr

  // Credit cash
  const proceeds = Number(qty) * price
  const cash = Number((await getOrCreatePortfolio(user_id)).cash) || 0
  const { error: cashErr } = await sb.from('portfolios').update({ cash: cash + proceeds }).eq('id', portfolio.id)
  if (cashErr) throw cashErr

  const { error: trErr } = await sb
    .from('trades')
    .insert({ symbol, price, qty: Number(qty), sell_user: user_id })
  if (trErr) throw trErr

  // Progression: record sell; realized PnL approximated as (price - avg_price) * qty
  const realizedPnl = (price - Number(existing.avg_price || 0)) * Number(qty)
  await bumpProgression(user_id, { realizedPnl, side: 'sell' })

  return true
}

async function processOrdersOnce() {
  // Fetch open orders in FIFO order
  const { data: orders, error } = await sb
    .from('orders')
    .select('id, user_id, symbol, side, order_type, qty, limit_price, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error

  for (const o of orders || []) {
    const side = String(o.side)
    const type = String(o.order_type)
    const symbol = String(o.symbol)
    const price = await latestPrice(symbol)
    if (!price) continue

    let shouldFill = false
    if (type === 'market') shouldFill = true
    else if (type === 'limit') {
      const lp = o.limit_price != null ? Number(o.limit_price) : null
      if (lp != null) {
        if (side === 'buy' && price <= lp) shouldFill = true
        if (side === 'sell' && price >= lp) shouldFill = true
      }
    }
    if (!shouldFill) continue

    try {
      let filled = false
      if (side === 'buy') filled = await fillBuy(o, price)
      else if (side === 'sell') filled = await fillSell(o, price)

      if (filled) {
        const { error: upErr } = await sb.from('orders').update({ status: 'filled' }).eq('id', o.id).eq('status', 'open')
        if (upErr) throw upErr
        console.log('[matcher] filled', o.id, o.symbol, o.side, 'at', price)
      }
    } catch (e) {
      console.error('[matcher] error filling order', o.id, e.message || e)
    }
  }
}

async function loop() {
  const interval = Number(process.env.ORDER_MATCH_INTERVAL_MS || 2000)
  console.log('[matcher] starting @', interval, 'ms')
  setInterval(processOrdersOnce, interval)
}

// --- Progression helpers (script-local) ---
async function bumpProgression(user_id, { realizedPnl, side }) {
  try {
    const { data: prof } = await sb.from('profiles').select('xp, stats').eq('user_id', user_id).maybeSingle()
    const xp = Number(prof?.xp || 0)
    const stats = prof?.stats || {}
    const tradesToday = Number(stats.trades_today || 0) + 1
    const profitableSells = Number(stats.profitable_sells_today || 0) + (realizedPnl > 0 && side === 'sell' ? 1 : 0)
    // XP: base + profit bonus
    const base = side === 'sell' ? 5 : 2
    const bonus = Math.max(0, Math.floor((realizedPnl || 0) / 2))
    const newXp = xp + base + bonus
    // Quest: minimal in-script update (server-side); ensure day key exists
    const day = new Date().toISOString().slice(0,10)
    const quest = stats.quest && stats.quest.day === day ? stats.quest : { day, goal_pnl: 10, progress_pnl: 0, done: false }
    if (realizedPnl > 0 && !quest.done) {
      quest.progress_pnl += realizedPnl
      if (quest.progress_pnl >= quest.goal_pnl) quest.done = true
    }
    // Titles
    const titles = new Set([...(stats.titles || [])])
    if (tradesToday >= 10) titles.add('Active Trader')
    if (profitableSells >= 3) titles.add('Closer')
    const newStats = { ...stats, trades_today: tradesToday, profitable_sells_today: profitableSells, quest, titles: Array.from(titles) }
    await sb.from('profiles').update({ xp: newXp, stats: newStats }).eq('user_id', user_id)
  } catch (e) {
    // non-fatal
    console.warn('[matcher progression] update failed:', e.message || e)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loop().catch((e) => { console.error(e); process.exit(1) })
}
