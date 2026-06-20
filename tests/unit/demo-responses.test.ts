import { createDemoTrade } from '@/lib/demo-responses'

describe('demo response helpers', () => {
  test('createDemoTrade uses symbol-specific demo prices', () => {
    const trade = createDemoTrade({
      playerId: 'demo-player',
      symbol: 'MTHR',
      side: 'BUY',
      amount: 1000
    })

    expect(trade.trade.symbol).toBe('MTHR')
    expect(trade.trade.side).toBe('buy')
    expect(trade.trade.executedPrice).toBe(132.6)
    expect(trade.trade.shares).toBe(7)
    expect(trade.trade.totalCost).toBe(928.2)
  })
})
