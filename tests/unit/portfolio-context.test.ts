import { renderHook, act } from '@testing-library/react-hooks';
import { PortfolioProvider, usePortfolio } from '../../contexts/portfolio-context';
import React from 'react';
import { toast } from '@/hooks/use-toast';

// Mock the toast function
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('Portfolio Context', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    // Reset toast mock
    jest.mocked(toast).mockClear();
  });

  it('should add and remove holdings correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => { return <PortfolioProvider>{children}</PortfolioProvider>; };
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    act(() => {
      result.current.addToPortfolio('AAPL', 10, 100);
    });
    expect(result.current.portfolio.holdings.length).toBe(1);
    expect(result.current.portfolio.holdings[0].symbol).toBe('AAPL');
    expect(result.current.portfolio.holdings[0].shares).toBe(10);
    expect(result.current.portfolio.cash).toBeLessThan(100);

    act(() => {
      result.current.removeFromPortfolio('AAPL', 5, 110);
    });
    expect(result.current.portfolio.holdings[0].shares).toBe(5);
    act(() => {
      result.current.removeFromPortfolio('AAPL', 5, 110);
    });
    expect(result.current.portfolio.holdings.length).toBe(0);
  });

  it('should add and remove watchlist items', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => { return <PortfolioProvider>{children}</PortfolioProvider>; };
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    act(() => {
      result.current.addToWatchlist('TSLA', 200, 3);
    });
    expect(result.current.portfolio.watchlist.length).toBe(1);
    expect(result.current.portfolio.watchlist[0].symbol).toBe('TSLA');

    act(() => {
      result.current.removeFromWatchlist('TSLA');
    });
    expect(result.current.portfolio.watchlist.length).toBe(0);
  });

  it('should not add duplicate watchlist items', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => { return <PortfolioProvider>{children}</PortfolioProvider>; };
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    act(() => {
      result.current.addToWatchlist('AAPL', 100, 1);
      result.current.addToWatchlist('AAPL', 101, 2);
    });

    expect(result.current.portfolio.watchlist.length).toBe(1);
    expect(result.current.portfolio.watchlist[0].symbol).toBe('AAPL');
    expect(result.current.portfolio.watchlist[0].price).toBe(100);
  });

  describe('Limit Orders', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => { return <PortfolioProvider>{children}</PortfolioProvider>; };
    it('should place a buy limit order and lock cash', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.addToPortfolio('AAPL', 1, 50); // Buy 1 AAPL @ $50
      });
      const cashBefore = result.current.portfolio.cash;
      act(() => {
        result.current.placeLimitOrder({ symbol: 'TSLA', qty: 1, limitPrice: 100, action: 'buy' });
      });
      const order = result.current.portfolio.limitOrders[0];
      expect(order.symbol).toBe('TSLA');
      expect(order.status).toBe('open');
      expect(result.current.portfolio.cash).toBe(cashBefore - 100);
    });
    it('should not place a buy limit order with insufficient funds', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'TSLA', qty: 10000, limitPrice: 100, action: 'buy' });
      });
      expect(result.current.portfolio.limitOrders.length).toBe(0);
    });
    it('should place a sell limit order and lock shares', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.addToPortfolio('AAPL', 10, 50);
      });
      const sharesBefore = result.current.portfolio.holdings[0].shares;
      act(() => {
        result.current.placeLimitOrder({ symbol: 'AAPL', qty: 5, limitPrice: 100, action: 'sell' });
      });
      const order = result.current.portfolio.limitOrders[0];
      expect(order.symbol).toBe('AAPL');
      expect(order.status).toBe('open');
      expect(result.current.portfolio.holdings[0].shares).toBe(sharesBefore - 5);
    });
    it('should not place a sell limit order with insufficient shares', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'AAPL', qty: 10, limitPrice: 100, action: 'sell' });
      });
      expect(result.current.portfolio.limitOrders.length).toBe(0);
    });
    it('should cancel an open limit order and unlock funds/shares', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.addToPortfolio('AAPL', 10, 50);
      });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'AAPL', qty: 5, limitPrice: 100, action: 'sell' });
      });
      const orderId = result.current.portfolio.limitOrders[0].id;
      const sharesLocked = result.current.portfolio.holdings[0].shares;
      act(() => {
        result.current.cancelLimitOrder(orderId);
      });
      expect(result.current.portfolio.limitOrders[0].status).toBe('cancelled');
      expect(result.current.portfolio.holdings[0].shares).toBe(10); // Shares unlocked
    });
    it('should fill a buy limit order when price drops', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'TSLA', qty: 1, limitPrice: 100, action: 'buy' });
      });
      const orderId = result.current.portfolio.limitOrders[0].id;
      act(() => {
        result.current.processLimitOrders({ TSLA: 90 });
      });
      expect(result.current.portfolio.limitOrders[0].status).toBe('filled');
      // Should have TSLA in holdings now
      expect(result.current.portfolio.holdings.some(h => h.symbol === 'TSLA')).toBe(true);
    });
    it('should fill a sell limit order when price rises', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.addToPortfolio('AAPL', 10, 50);
      });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'AAPL', qty: 5, limitPrice: 100, action: 'sell' });
      });
      act(() => {
        result.current.processLimitOrders({ AAPL: 110 });
      });
      expect(result.current.portfolio.limitOrders[0].status).toBe('filled');
    });
    it('should not fill a limit order if price not met', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.placeLimitOrder({ symbol: 'TSLA', qty: 1, limitPrice: 100, action: 'buy' });
      });
      act(() => {
        result.current.processLimitOrders({ TSLA: 120 });
      });
      expect(result.current.portfolio.limitOrders[0].status).toBe('open');
    });
    // Edge: cancel non-existent order
    it('should not throw when cancelling a non-existent order', () => {
      const { result } = renderHook(() => usePortfolio(), { wrapper });
      act(() => {
        result.current.cancelLimitOrder("fake-id-123");
      });
      expect(result.current.portfolio.limitOrders.length).toBe(0);
    });
  });
});
