export function computeTakeProfitPrice(entryPrice: number, takeProfitPct: number): number {
  const p = entryPrice * (1 + takeProfitPct / 100)
  return Math.round(p * 100) / 100
}

