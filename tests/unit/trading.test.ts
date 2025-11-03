import { computeTakeProfitPrice } from '@/lib/trading'

describe('trading helpers', () => {
  test('computeTakeProfitPrice rounds to cents', () => {
    expect(computeTakeProfitPrice(10, 10)).toBe(11)
    expect(computeTakeProfitPrice(10.01, 5)).toBe(10.51)
    expect(computeTakeProfitPrice(0.99, 50)).toBe(1.49)
  })
})

