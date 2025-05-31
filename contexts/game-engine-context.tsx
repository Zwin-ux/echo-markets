"use client"

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { usePortfolio } from "./portfolio-context"; // Import usePortfolio

// Types for game phases, events, and engine state
export type GamePhase = "pre-market" | "open" | "close" | "post-market";
export type GameEventType =
  | "market_news"
  | "random_event"
  | "achievement"
  | "tick"
  | "challenge"
  | "milestone"
  | "player_level_up"
  | "xp_gain";

export interface GameEvent {
  id: string;
  type: GameEventType;
  payload?: any;
  timestamp: number;
}

// Utility for common progression events (for use in modules)
export function createLevelUpEvent(level: number): GameEvent {
  return {
    id: `level-up-${level}-${Date.now()}`,
    type: "player_level_up",
    payload: { level },
    timestamp: Date.now(),
  };
}

export function createXPGainEvent(amount: number): GameEvent {
  return {
    id: `xp-gain-${amount}-${Date.now()}`,
    type: "xp_gain",
    payload: { amount },
    timestamp: Date.now(),
  };
}

export function createMilestoneEvent(name: string, description: string): GameEvent {
  return {
    id: `milestone-${name}-${Date.now()}`,
    type: "milestone",
    payload: { name, description },
    timestamp: Date.now(),
  };
}

export function createChallengeEvent(name: string, description: string): GameEvent {
  return {
    id: `challenge-${name}-${Date.now()}`,
    type: "challenge",
    payload: { name, description },
    timestamp: Date.now(),
  };
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  volatility: number; // A measure of how much the stock price fluctuates
  history: { date: number; price: number }[]; // To store price history for charts
}

export interface MarketNewsArticle {
  id: string;
  headline: string;
  content: string; // Detailed content of the news
  impact?: {
    // Optional: Define how news might impact specific stocks or sectors
    stocks?: string[]; // Symbols of affected stocks
    sectors?: string[]; // Names of affected sectors
    sentiment: "positive" | "negative" | "neutral";
    magnitude: number; // 0 to 1, how strong the impact is
  };
  timestamp: number;
}

export interface GameEngineState {
  tick: number;
  phase: GamePhase;
  events: GameEvent[];
  marketConditions: {
    volatility: number;
    trend: "bullish" | "bearish" | "neutral";
  };
  stocks: Stock[];
  marketNews: MarketNewsArticle[];
}

interface GameEngineContextType {
  state: GameEngineState;
  dispatchEvent: (event: GameEvent) => void;
  subscribe: (listener: (event: GameEvent) => void) => () => void;
  executeBuyOrder: (stockSymbol: string, quantity: number, price: number) => boolean;
  executeSellOrder: (stockSymbol: string, quantity: number, price: number) => boolean;
  // Function to manually set stocks for testing or initialization
  setStocks: (stocks: Stock[]) => void;
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined);

interface GameEngineProviderProps {
  children: ReactNode;
  initialStocks?: Stock[]; // Optional initial stocks for testing/setup
}

export function GameEngineProvider({ children, initialStocks = [] }: GameEngineProviderProps) {
  const portfolioContext = usePortfolio(); // Get portfolio context
  const [state, setState] = useState<GameEngineState>({
    tick: 0,
    phase: "pre-market",
    events: [],
    marketConditions: {
      volatility: 1,
      trend: "neutral",
    },
    stocks: initialStocks, // Use initialStocks here
    marketNews: [],
  });

  const listeners = useRef<((event: GameEvent) => void)[]>([]);

  // Function to manually set stocks, e.g., for testing or dynamic loading
  const setStocks = useCallback((newStocks: Stock[]) => {
    setState(prev => ({
      ...prev,
      stocks: newStocks,
    }));
  }, []);

  // Game loop: advances tick, updates stocks, and triggers tick events
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const newTick = prev.tick + 1;

        // 1. Update stock prices
        const updatedStocks = prev.stocks.map(stock => {
          let priceChange = (Math.random() - 0.5) * stock.volatility; // Base change

          // Apply market trend
          if (prev.marketConditions.trend === "bullish") {
            priceChange += 0.1 * stock.volatility;
          } else if (prev.marketConditions.trend === "bearish") {
            priceChange -= 0.1 * stock.volatility;
          }

          // Apply overall market volatility
          priceChange *= prev.marketConditions.volatility;

          let newPrice = stock.price + priceChange;
          newPrice = Math.max(0.01, newPrice); // Ensure price doesn't go below $0.01

          // Add to history (keep last 50 points for example)
          const newHistory = [...stock.history, { date: Date.now(), price: newPrice }].slice(-50);

          return {
            ...stock,
            price: newPrice,
            history: newHistory,
          };
        });

        const tickEvent: GameEvent = {
          id: `tick-${newTick}`,
          type: "tick",
          timestamp: Date.now(),
        };

        // Notify listeners about the tick event specifically
        listeners.current.forEach(fn => fn(tickEvent));

        return {
          ...prev,
          tick: newTick,
          stocks: updatedStocks,
          events: [...prev.events, tickEvent].slice(-100), // Keep events list manageable
          // marketNews will be updated by its specific event generator
        };
      });
    }, 2000); // 2s per tick, adjustable
    return () => clearInterval(interval);
  }, []); // Removed state.stocks from dependencies to avoid re-running when stocks are programmatically updated by trades

  // Dispatch a custom event
  const dispatchEvent = useCallback((event: GameEvent) => {
    setState(prev => {
      const newState = {
        ...prev,
        events: [...prev.events, event].slice(-100),
      };
      if (event.type === "market_news" && event.payload) {
        newState.marketNews = [event.payload as MarketNewsArticle, ...prev.marketNews].slice(-20);
      }
      return newState;
    });
    listeners.current.forEach(fn => fn(event));
  }, []);

  // Subscribe to events
  const subscribe = useCallback((listener: (event: GameEvent) => void) => {
    listeners.current.push(listener);
    return () => {
      listeners.current = listeners.current.filter(fn => fn !== listener);
    };
  }, []);

  // Generate detailed market news every 10 ticks
  useEffect(() => {
    if (state.tick > 0 && state.tick % 10 === 0) {
      // Example detailed news generation
      const newsHeadlines = [
        "Tech Sector Surges on New Innovations",
        "Oil Prices Fluctuate Amidst Global Tensions",
        "Healthcare Stocks Rally on Breakthrough Research",
        "Consumer Goods See Steady Growth This Quarter",
        "Financial Markets React to Central Bank Policies"
      ];
      const randomHeadline = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
      const sentimentType = Math.random() > 0.5 ? "positive" : "negative";

      const newMarketArticle: MarketNewsArticle = {
        id: `news-${state.tick}-${Date.now()}`,
        headline: randomHeadline,
        content: `Detailed analysis of "${randomHeadline}". Economic indicators suggest a ${sentimentType} outlook for the coming period. Investors are watching closely. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        impact: {
          sentiment: sentimentType,
          magnitude: Math.random() * 0.5 + 0.1, // Between 0.1 and 0.6
        },
        timestamp: Date.now(),
      };

      const marketNewsEvent: GameEvent = {
        id: `market-news-event-${state.tick}`,
        type: "market_news",
        payload: newMarketArticle, // The payload is the article itself
        timestamp: Date.now(),
      };
      dispatchEvent(marketNewsEvent);
    }
  }, [state.tick, dispatchEvent]);

  // Generate company-specific events every 15 ticks (example)
  useEffect(() => {
    if (state.stocks.length > 0 && state.tick > 0 && state.tick % 15 === 0) {
      const randomStockIndex = Math.floor(Math.random() * state.stocks.length);
      const targetStock = state.stocks[randomStockIndex];
      const isPositiveEvent = Math.random() > 0.5;

      const companyEvent: GameEvent = {
        id: `company-event-${targetStock.symbol}-${state.tick}`,
        type: "random_event", // Or a new specific type e.g., "company_event"
        payload: {
          stockSymbol: targetStock.symbol,
          headline: isPositiveEvent
            ? `${targetStock.name} announces record profits!`
            : `${targetStock.name} faces unexpected production delays.`,
          impact_sentiment: isPositiveEvent ? "positive" : "negative",
        },
        timestamp: Date.now(),
      };
      dispatchEvent(companyEvent);
    }
  }, [state.tick, state.stocks, dispatchEvent]); // state.stocks is okay here as it's for selection

  const executeBuyOrder = useCallback((stockSymbol: string, quantity: number, price: number): boolean => {
    if (!portfolioContext) return false;
    const result = portfolioContext.addToPortfolio(stockSymbol, quantity, price);

    if (result.success) {
      setState(prev => {
        const stockIndex = prev.stocks.findIndex(s => s.symbol === stockSymbol);
        if (stockIndex === -1) return prev;

        const updatedStocks = [...prev.stocks];
        const priceImpact = 0.01 * Math.log10(quantity + 1) * price; // Price impact relative to current price
        updatedStocks[stockIndex] = {
          ...updatedStocks[stockIndex],
          price: Math.max(0.01, updatedStocks[stockIndex].price + priceImpact), // Ensure price doesn't drop below 0.01
        };

        const volatilityImpact = 0.0005 * Math.log10(quantity + 1);

        return {
          ...prev,
          stocks: updatedStocks,
          marketConditions: {
            ...prev.marketConditions,
            volatility: Math.max(0.1, prev.marketConditions.volatility + volatilityImpact), // Ensure min volatility
          }
        };
      });
      return true;
    }
    return false;
  }, [portfolioContext]);

  const executeSellOrder = useCallback((stockSymbol: string, quantity: number, price: number): boolean => {
    if (!portfolioContext) return false;
    const result = portfolioContext.removeFromPortfolio(stockSymbol, quantity, price);

    if (result.success) {
      setState(prev => {
        const stockIndex = prev.stocks.findIndex(s => s.symbol === stockSymbol);
        if (stockIndex === -1) return prev;

        const updatedStocks = [...prev.stocks];
        const priceImpact = 0.01 * Math.log10(quantity + 1) * price; // Price impact relative to current price
        updatedStocks[stockIndex] = {
          ...updatedStocks[stockIndex],
          price: Math.max(0.01, updatedStocks[stockIndex].price - priceImpact), // Ensure price doesn't drop below 0.01
        };

        const volatilityImpact = 0.0005 * Math.log10(quantity + 1);

        return {
          ...prev,
          stocks: updatedStocks,
          marketConditions: {
            ...prev.marketConditions,
            volatility: Math.max(0.1, prev.marketConditions.volatility + volatilityImpact), // Ensure min volatility
          }
        };
      });
      return true;
    }
    return false;
  }, [portfolioContext]);

  return (
    <GameEngineContext.Provider value={{ state, dispatchEvent, subscribe, executeBuyOrder, executeSellOrder, setStocks }}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) throw new Error("useGameEngine must be used within a GameEngineProvider");
  return context;
}
