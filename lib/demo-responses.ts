export const DEMO_PLAYER_ID = 'demo-player'

export function createDemoGuestSession() {
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 7)

  return {
    user: {
      id: DEMO_PLAYER_ID,
      username: 'SignalSeer',
      display_name: 'SignalSeer',
      email: null,
      avatar_url: 'signal',
      bio: 'Demo trader for the public Echo Markets build.',
      is_guest: true,
      profile_public: true,
      trades_public: false,
      allow_copy_trading: false,
      followers_count: 0,
      following_count: 0,
      total_score: 12000,
      rank_tier: 'demo',
      created_at: now.toISOString(),
      last_active: now.toISOString(),
      preferences: {}
    },
    session_token: `demo-session-${now.getTime()}`,
    expires_at: expiresAt.toISOString(),
    demoMode: true
  }
}

export function createDemoPlayer(playerId = DEMO_PLAYER_ID) {
  return {
    id: playerId,
    username: playerId === DEMO_PLAYER_ID ? 'SignalSeer' : 'Guest Signal',
    level: 4,
    xp: 1850,
    totalValue: 12000,
    dayChange: 0,
    rank: 17,
    achievements: ['rumor_monger', 'early_hype'],
    streak: 3,
    joinedAt: new Date().toISOString(),
    demoMode: true
  }
}

export function createDemoLeaderboard(limit = 50) {
  const rows: Array<[string, number, number]> = [
    ['SignalSeer', 12000, 4],
    ['RumorDesk', 11780, 4],
    ['HypeCycle', 11240, 3],
    ['OracleFeed', 10890, 3],
    ['CultureBid', 10480, 2],
    ['TapeReader', 10120, 2]
  ]

  return rows.slice(0, limit).map(([username, totalValue, level], index) => ({
    id: `demo-leader-${index + 1}`,
    rank: index + 1,
    playerId: `demo-leader-${index + 1}`,
    username,
    score: totalValue,
    totalValue,
    level,
    xp: Number(totalValue) - 10000,
    dayChange: Number(totalValue) - 10000,
    change: Number(totalValue) - 10000,
    badge: index === 0 ? 'top-signal' : index < 3 ? 'hot-hand' : 'live-wire',
    isOnline: index < 4,
    achievements: [],
    streak: Math.max(1, 6 - index)
  }))
}

export function createDemoMarketState(symbols?: string[]) {
  const basePrices = [
    { symbol: 'SCNDL', price: 48.2, change: 1.41, changePercent: 3, volume: 820000, volatility: 0.32 },
    { symbol: 'HYPE', price: 73.8, change: -2.05, changePercent: -2.7, volume: 670000, volatility: 0.39 },
    { symbol: 'MTHR', price: 132.6, change: 6.82, changePercent: 5.4, volume: 440000, volatility: 0.27 },
    { symbol: 'FURY', price: 25.1, change: -0.8, changePercent: -3.1, volume: 910000, volatility: 0.44 },
    { symbol: 'ORCL', price: 16.4, change: 0.4, changePercent: 2.5, volume: 380000, volatility: 0.18 },
    { symbol: 'VIBE', price: 58.9, change: 1.1, changePercent: 1.9, volume: 730000, volatility: 0.29 }
  ]

  const requested = symbols?.length ? new Set(symbols) : null
  const prices = basePrices
    .filter((tick) => !requested || requested.has(tick.symbol))
    .map((tick) => ({
      ...tick,
      bid: Number((tick.price - 0.03).toFixed(2)),
      ask: Number((tick.price + 0.03).toFixed(2)),
      timestamp: new Date().toISOString()
    }))

  return {
    marketState: {
      isOpen: true,
      dramaScore: 68,
      volatilityRegime: 'normal',
      marketTrend: 'bullish'
    },
    prices,
    events: {
      active: [],
      count: 0
    },
    timestamp: new Date().toISOString(),
    demoMode: true
  }
}

export function createDemoTrade(input: {
  playerId: string
  symbol: string
  side: string
  amount: number
}) {
  const price = 48.2
  const shares = Math.max(1, Math.floor(input.amount / price))
  const totalCost = Number((shares * price).toFixed(2))
  const xpGained = Math.max(10, Math.floor(totalCost / 100))

  return {
    trade: {
      orderId: `demo-order-${Date.now()}`,
      symbol: input.symbol,
      side: input.side,
      shares,
      executedPrice: price,
      totalCost,
      timestamp: new Date().toISOString()
    },
    rewards: {
      xpGained,
      achievements: ['first_trade'],
      levelUp: xpGained > 500
    },
    socialFeed: {
      id: `demo-feed-${Date.now()}`,
      playerId: input.playerId,
      type: 'trade',
      message: `${input.side.toUpperCase()} ${shares} ${input.symbol} in demo mode`,
      timestamp: new Date().toISOString(),
      impact: Math.min(totalCost / 100000, 0.1)
    },
    marketImpact: Math.min(totalCost / 100000, 0.1),
    demoMode: true
  }
}
