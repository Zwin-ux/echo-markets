import { computeXpForTrade, updateQuest, assignTitles, defaultQuest } from '@/lib/progression'

describe('progression helpers', () => {
  test('computeXpForTrade rewards profit on sell', () => {
    expect(computeXpForTrade('sell', 0)).toBe(5)
    expect(computeXpForTrade('sell', 4)).toBe(7) // +2 bonus
    expect(computeXpForTrade('sell', 10)).toBe(10) // 5 + floor(10/2)
  })

  test('computeXpForTrade small base for buy', () => {
    expect(computeXpForTrade('buy', 0)).toBe(2)
  })

  test('updateQuest initializes when missing and progresses', () => {
    const stats: any = {}
    const updated = updateQuest(stats, 6, new Date('2025-01-02'), 10)
    expect(updated.quest?.day).toBe('2025-01-02')
    expect(updated.quest?.progress_pnl).toBe(6)
    expect(updated.quest?.done).toBe(false)
    const updated2 = updateQuest(updated, 5, new Date('2025-01-02'), 10)
    expect(updated2.quest?.progress_pnl).toBe(11)
    expect(updated2.quest?.done).toBe(true)
  })

  test('assignTitles adds titles by thresholds', () => {
    const stats: any = { trades_today: 11, profitable_sells_today: 3 }
    const titles = assignTitles(stats)
    expect(titles).toContain('Active Trader')
    expect(titles).toContain('Closer')
  })
})

