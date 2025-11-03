// Centralized runtime configuration and feature flags

export const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL'] as const
export type SymbolCode = typeof SYMBOLS[number]

export const FEATURES = {
  authAnonymous: true,
  authMagicLink: false,
  realtimeTicks: true,
  realtimeOrders: true,
  realtimeTrades: true,
} as const

export function getEnv(key: string, fallback?: string): string {
  if (typeof window !== 'undefined') {
    // client
    // @ts-expect-error injected at build
    return (process?.env?.[key] as string) ?? fallback ?? ''
  }
  return (process.env[key] as string) ?? fallback ?? ''
}

export function getStartingCash(): number {
  const pub = getEnv('NEXT_PUBLIC_STARTING_CASH')
  const srv = getEnv('STARTING_CASH')
  const val = pub || srv || '1000'
  const n = Number(val)
  return Number.isFinite(n) && n > 0 ? n : 1000
}
