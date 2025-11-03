// Progression helpers: XP, daily quest, and titles

export type Side = 'buy' | 'sell'

export interface QuestState {
  day: string
  goal_pnl: number // absolute dollar target for realized profits
  progress_pnl: number
  done: boolean
}

export interface ProfileStats {
  trades_today?: number
  profitable_sells_today?: number
  quest?: QuestState
  titles?: string[]
}

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function defaultQuest(goal = 10, now = new Date()): QuestState {
  return { day: todayStr(now), goal_pnl: goal, progress_pnl: 0, done: false }
}

export function computeXpForTrade(side: Side, realizedPnl: number): number {
  // Simple rule: base + profit bonus; small credit for buys
  const base = side === 'sell' ? 5 : 2
  const bonus = Math.max(0, Math.floor(realizedPnl / 2)) // +1 XP per $2 profit
  return base + bonus
}

export function updateQuest(stats: ProfileStats, realizedPnl: number, now = new Date(), goal = 10): ProfileStats {
  const day = todayStr(now)
  const q: QuestState = stats.quest && stats.quest.day === day ? stats.quest : defaultQuest(goal, now)
  if (realizedPnl > 0 && !q.done) {
    q.progress_pnl += realizedPnl
    if (q.progress_pnl >= q.goal_pnl) q.done = true
  }
  return { ...stats, quest: q }
}

export function assignTitles(stats: ProfileStats): string[] {
  const titles = new Set<string>(stats.titles || [])
  if ((stats.trades_today || 0) >= 10) titles.add('Active Trader')
  if ((stats.profitable_sells_today || 0) >= 3) titles.add('Closer')
  return Array.from(titles)
}

