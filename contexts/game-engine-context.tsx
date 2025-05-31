"use client"

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { usePortfolio } from "./portfolio-context"; // Import usePortfolio

// Types for game phases, events, and engine state
export type GamePhase = "pre-market" | "open" | "close" | "post-market";
export type GameEventType =
  | "tick" // Regular game tick
  | "market_news" // General news article added (payload is MarketNewsArticle)
  | "company_news" // Specific news about a company
  | "economic_indicator" // Release of an economic indicator
  | "regulatory_change" // News about new regulations
  | "social_media_trend" // A stock is trending on social media
  | "player_trade_impact" // Impact of a player's trade on a stock
  | "analyst_rating_change" // Analyst upgrades/downgrades a stock
  // Player progression & generic events
  | "achievement"
  | "challenge"
  | "milestone"
  | "player_level_up"
  | "xp_gain"
  | "random_event"; // Generic random event, try to use more specific types

// --- Payload Structures for New Event Types ---

export interface CompanyNewsPayload {
  stockSymbol: string;
  headline: string;
  sentiment: "positive" | "negative" | "neutral";
  impactMagnitude: number; // e.g., 0.1 to 1.0, affecting price/volatility change
  articleId?: string; // Optional: link to a full MarketNewsArticle
}

export interface EconomicIndicatorPayload {
  indicatorName: string; // e.g., "Inflation Rate", "Unemployment Rate"
  value: string | number;
  changeDirection?: "up" | "down" | "stable"; // Optional: For some indicators
  impactScope: "market-wide" | "sector-specific" | "stock-specific";
  affectedSector?: string; // if sector-specific
  affectedSymbol?: string; // if stock-specific
  sentiment: "positive" | "negative" | "neutral"; // Overall sentiment of this news
}

export interface RegulatoryChangePayload {
  description: string;
  affectedSector?: string[]; // Sectors primarily affected
  affectedSymbol?: string[]; // Specific stocks primarily affected
  sentiment: "positive" | "negative" | "neutral";
  impactMagnitude: number;
}

export interface SocialMediaTrendPayload {
  stockSymbol: string;
  trendIntensity: "low" | "medium" | "high"; // How strongly it's trending
  sentiment: "positive" | "negative" | "mixed";
  source?: string; // e.g., "WallStreetBets", "Twitter"
}

export interface PlayerTradeImpactPayload {
  stockSymbol: string;
  tradeAction: "buy" | "sell";
  quantity: number;
  tradePrice: number;
  priceChangeApplied: number; // How much the stock's base price was changed due to this trade
  volatilityChangeApplied: number; // How much market volatility was changed
}

export interface AnalystRatingChangePayload {
  stockSymbol: string;
  analystFirm: string;
  previousRating?: string; // e.g., "Hold", "Buy"
  newRating: string; // e.g., "Strong Buy", "Sell"
  priceTarget?: number;
  sentiment: "positive" | "negative" | "neutral";
}


export interface GameEvent {
  id: string;
  type: GameEventType;
  payload?: any; // Remains `any` for now, consumers type-check based on `type`
  timestamp: number;
}

// --- Event Generator Framework ---
export interface EventGeneratorParams {
  currentState: GameEngineState;
  dispatch: (event: GameEvent) => void; // To allow generators to dispatch events directly
}

export interface EventGenerator {
  id: string; // Unique ID for the generator
  category: string; // For organization or specific controls
  generate: (params: EventGeneratorParams) => void; // Changed to void, dispatches internally
  // Optional: initialize method if generator needs setup
  // initialize?: (params: EventGeneratorParams) => void;
  // Optional: method to update generator's internal state/timers each tick
  // onTick?: (tick: number) => void;
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

  // --- Concrete Event Generators ---
  // (These would ideally be in separate files in a larger application)

  const MarketNewsArticleGenerator: EventGenerator = {
    id: "marketNewsArticleGen",
    category: "market_news",
    generate: ({ currentState, dispatch }) => {
      // Trigger every 10 ticks (example)
      if (currentState.tick > 0 && currentState.tick % 10 === 0) {
        const newsHeadlines = [
          "Tech Sector Surges on New Innovations", "Oil Prices Fluctuate Amidst Global Tensions",
          "Healthcare Stocks Rally on Breakthrough Research", "Consumer Goods See Steady Growth",
          "Financial Markets React to Central Bank Policies"
        ];
        const randomHeadline = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        const sentimentType = Math.random() > 0.5 ? "positive" : "negative";

        const newMarketArticle: MarketNewsArticle = {
          id: `news-${currentState.tick}-${Date.now()}`,
          headline: randomHeadline,
          content: `Detailed analysis of "${randomHeadline}". Economic indicators suggest a ${sentimentType} outlook.`,
          impact: { sentiment: sentimentType, magnitude: Math.random() * 0.5 + 0.1 },
          timestamp: Date.now(),
        };
        dispatch({
          id: `market-news-event-${currentState.tick}`, type: "market_news",
          payload: newMarketArticle, timestamp: Date.now(),
        });
      }
    }
  };

  const CompanyNewsGenerator: EventGenerator = {
    id: "companyNewsGen",
    category: "company_news",
    generate: ({ currentState, dispatch }) => {
      // Company news: ~5% chance each tick if stocks exist, but not more than one per 5 ticks.
      // This uses a simple global timer; a per-stock cooldown might be better.
      if (currentState.stocks.length > 0 && currentState.tick > 0 && currentState.tick % 8 === 0) { // Approx every 16 seconds
        if (Math.random() < 0.4) { // Chance to fire on eligible tick
          const targetStock = currentState.stocks[Math.floor(Math.random() * currentState.stocks.length)];

          const newsTypes = [
            { type: "PRODUCT_LAUNCH", positive: true, minImpact: 0.2, maxImpact: 0.5, headline: `${targetStock.name} announces new groundbreaking product {PRODUCT_NAME}!`},
            { type: "SCANDAL", positive: false, minImpact: 0.3, maxImpact: 0.7, headline: `Scandal hits ${targetStock.name} over {SCANDAL_DETAILS} allegations!`},
            { type: "EARNINGS_BEAT", positive: true, minImpact: 0.1, maxImpact: 0.4, headline: `${targetStock.name} reports earnings above expectations, citing strong growth.`},
            { type: "EARNINGS_MISS", positive: false, minImpact: 0.1, maxImpact: 0.4, headline: `${targetStock.name} misses earnings estimates, investors concerned.`},
            { type: "MERGER_RUMOR", positive: true, minImpact: 0.2, maxImpact: 0.6, headline: `Rumors of ${targetStock.name} being an acquisition target by {ACQUIRER_CO} resurface.`},
            { type: "CEO_CHANGE", positive: Math.random() > 0.5, minImpact: 0.1, maxImpact: 0.3, headline: `${targetStock.name} announces new CEO, {CEO_NAME}, effective immediately.`}
          ];
          const selectedNews = newsTypes[Math.floor(Math.random() * newsTypes.length)];

          // Simple placeholder replacement
          let headline = selectedNews.headline
            .replace("{PRODUCT_NAME}", "XenonMax")
            .replace("{SCANDAL_DETAILS}", "accounting irregularities")
            .replace("{ACQUIRER_CO}", "Global Conglomerate Inc.")
            .replace("{CEO_NAME}", "Dr. Alex Quantum");

          const payload: CompanyNewsPayload = {
            stockSymbol: targetStock.symbol,
            headline: headline,
            sentiment: selectedNews.positive ? "positive" : "negative",
            impactMagnitude: Math.random() * (selectedNews.maxImpact - selectedNews.minImpact) + selectedNews.minImpact,
          };
          dispatch({
            id: `company-news-${targetStock.symbol}-${selectedNews.type.toLowerCase()}-${currentState.tick}`, type: "company_news",
            payload, timestamp: Date.now(),
          });
        }
      }
    }
  };

  const EconomicIndicatorGenerator: EventGenerator = {
    id: "economicIndicatorGen",
    category: "economic_indicator",
    generate: ({ currentState, dispatch }) => {
        // Trigger approx every 25 ticks (50 seconds)
        if (currentState.tick > 0 && currentState.tick % 25 === 0) {
            const indicators = [
                { name: "Inflation Rate (CPI)", typicalValue: "2.5%", positiveIf: "down" as const, scope: "market-wide" as const },
                { name: "Unemployment Rate", typicalValue: "4.0%", positiveIf: "down" as const, scope: "market-wide" as const },
                { name: "GDP Growth Rate", typicalValue: "0.5% QoQ", positiveIf: "up" as const, scope: "market-wide" as const },
                { name: "Manufacturing PMI", typicalValue: "52.0", positiveIf: "up" as const, scope: "sector-specific" as const, sector: "Industrial" },
                { name: "Consumer Confidence Index", typicalValue: "105.0", positiveIf: "up" as const, scope: "market-wide" as const }
            ];
            const selectedIndicator = indicators[Math.floor(Math.random() * indicators.length)];
            const valueFluctuation = (Math.random() - 0.45) * 0.5; // Slight change to typical value
            const numericPart = parseFloat(selectedIndicator.typicalValue);
            const unit = selectedIndicator.typicalValue.replace(String(numericPart), "");
            const currentValue = (numericPart + numericPart * valueFluctuation).toFixed(1) + unit;

            let changeDirection: "up" | "down" | "stable" = "stable";
            if (valueFluctuation > 0.05) changeDirection = "up";
            else if (valueFluctuation < -0.05) changeDirection = "down";

            const sentiment: "positive" | "negative" | "neutral" =
                changeDirection === "stable" ? "neutral" :
                changeDirection === selectedIndicator.positiveIf ? "positive" : "negative";

            const payload: EconomicIndicatorPayload = {
                indicatorName: selectedIndicator.name,
                value: currentValue,
                changeDirection: changeDirection,
                impactScope: selectedIndicator.scope,
                affectedSector: selectedIndicator.sector,
                sentiment: sentiment,
            };
            dispatch({
                id: `economic-indicator-${selectedIndicator.name.replace(/\s+/g, '-')}-${currentState.tick}`,
                type: "economic_indicator",
                payload, timestamp: Date.now(),
            });
        }
    }
  };

  const SocialMediaTrendGenerator: EventGenerator = {
    id: "socialMediaTrendGen",
    category: "social_media_trend",
    generate: ({ currentState, dispatch }) => {
      // Trigger approx every 12 ticks (24 seconds), higher chance if market is volatile
      if (currentState.stocks.length > 0 && currentState.tick > 0 && currentState.tick % 12 === 0) {
        if (Math.random() < (0.3 + currentState.marketConditions.volatility * 0.1)) { // Base 30% + volatility mod
          const targetStock = currentState.stocks[Math.floor(Math.random() * currentState.stocks.length)];
          const sentiments: Array<SocialMediaTrendPayload['sentiment']> = ["positive", "negative", "mixed"];
          const intensities: Array<SocialMediaTrendPayload['trendIntensity']> = ["low", "medium", "high"];
          const sources = ["WallStreetBets", "StockTwits", "Twitter influencers"];

          const payload: SocialMediaTrendPayload = {
            stockSymbol: targetStock.symbol,
            trendIntensity: intensities[Math.floor(Math.random() * intensities.length)],
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
          };
          dispatch({
            id: `social-trend-${targetStock.symbol}-${currentState.tick}`, type: "social_media_trend",
            payload, timestamp: Date.now(),
          });
        }
      }
    }
  };

  const AnalystRatingChangeGenerator: EventGenerator = {
    id: "analystRatingChangeGen",
    category: "analyst_rating_change",
    generate: ({ currentState, dispatch }) => {
      // Trigger approx every 30 ticks (60 seconds)
      if (currentState.stocks.length > 0 && currentState.tick > 0 && currentState.tick % 30 === 0) {
         if (Math.random() < 0.5) { // 50% chance on eligible tick
            const targetStock = currentState.stocks[Math.floor(Math.random() * currentState.stocks.length)];
            const firms = ["Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "Independent Research Co."];
            const ratings = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
            const previousRating = ratings[Math.floor(Math.random() * ratings.length)];
            let newRating = ratings[Math.floor(Math.random() * ratings.length)];
            while (newRating === previousRating) { // Ensure rating changes
                newRating = ratings[Math.floor(Math.random() * ratings.length)];
            }

            const ratingSentiment = (r: string) => {
                if (r.includes("Buy")) return "positive";
                if (r.includes("Sell")) return "negative";
                return "neutral";
            }

            const priceTargetChange = (Math.random() - 0.5) * 0.2; // +/- 20% of current price
            const newPriceTarget = targetStock.price * (1 + priceTargetChange);

            const payload: AnalystRatingChangePayload = {
                stockSymbol: targetStock.symbol,
                analystFirm: firms[Math.floor(Math.random() * firms.length)],
                previousRating: previousRating,
                newRating: newRating,
                priceTarget: parseFloat(newPriceTarget.toFixed(2)),
                sentiment: ratingSentiment(newRating),
            };
            dispatch({
                id: `analyst-rating-${targetStock.symbol}-${currentState.tick}`, type: "analyst_rating_change",
                payload, timestamp: Date.now(),
            });
        }
      }
    }
  };

  // Array of active event generators
  const eventGenerators = useRef<EventGenerator[]>([
    MarketNewsArticleGenerator,
    CompanyNewsGenerator,
    EconomicIndicatorGenerator,
    SocialMediaTrendGenerator,
    AnalystRatingChangeGenerator,
  ]).current;


  // Dispatch a custom event - this remains the primary way to get events into the system
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

  // Game loop: advances tick, updates stocks, AND RUNS EVENT GENERATORS
  useEffect(() => {
    const interval = setInterval(() => {
      // Capture the current state for generators to use
      // setState itself is async, so we need a stable reference for the current tick's generation phase
      const currentStateForGeneration = { ...state, tick: state.tick + 1 };

      // Run event generators
      // Generators can dispatch events, which will update the state via `dispatchEvent`
      // and be collected for the next state update.
      const generatorParams: EventGeneratorParams = {
        currentState: currentStateForGeneration,
        dispatch: dispatchEvent // Pass the memoized dispatchEvent
      };
      eventGenerators.forEach(generator => generator.generate(generatorParams));

      setState(prev => {
        const newTick = prev.tick + 1;

        // --- START: Event-driven impact calculation ---
        // We will calculate adjustments based on events that occurred SINCE the last price update.
        // For simplicity in this step, we consider events dispatched in the current generator cycle + the tick event itself.
        // A more robust system might use event timestamps and a "lastProcessedEventTimestamp" for price updates.

        // Filter for relevant events that can influence stock prices
        const priceImpactingEvents = prev.events.filter(event =>
          [
            "company_news",
            "economic_indicator",
            "social_media_trend",
            "analyst_rating_change"
            // player_trade_impact is handled immediately in executeBuy/SellOrder for its direct price effect
          ].includes(event.type) &&
          event.timestamp > (Date.now() - 3000) // Process events from the last ~3s (slightly more than tick interval)
                                                // This is a simple way to grab recent events.
        );

        const stockPriceAdjustments: Record<string, number> = {}; // symbol -> total adjustment factor

        priceImpactingEvents.forEach(event => {
          const payload = event.payload;
          let adjustment = 0;
          let sentimentMultiplier = 0;

          if (payload.sentiment === "positive") sentimentMultiplier = 1;
          else if (payload.sentiment === "negative") sentimentMultiplier = -1;
          else if (payload.sentiment === "mixed") sentimentMultiplier = (Math.random() - 0.5) * 0.5; // Smaller, random impact for mixed

          switch (event.type) {
            case "company_news":
              const cnPayload = payload as CompanyNewsPayload;
              adjustment = sentimentMultiplier * cnPayload.impactMagnitude * 0.05; // Base 5% of magnitude
              stockPriceAdjustments[cnPayload.stockSymbol] = (stockPriceAdjustments[cnPayload.stockSymbol] || 0) + adjustment;
              break;

            case "economic_indicator":
              const eiPayload = payload as EconomicIndicatorPayload;
              if (eiPayload.impactScope === "market-wide") {
                adjustment = sentimentMultiplier * 0.005; // Smaller base impact for market-wide
                prev.stocks.forEach(stock => {
                  stockPriceAdjustments[stock.symbol] = (stockPriceAdjustments[stock.symbol] || 0) + adjustment;
                });
              } else if (eiPayload.impactScope === "stock-specific" && eiPayload.affectedSymbol) {
                 adjustment = sentimentMultiplier * 0.01;
                 stockPriceAdjustments[eiPayload.affectedSymbol] = (stockPriceAdjustments[eiPayload.affectedSymbol] || 0) + adjustment;
              }
              // Sector-specific would require stocks to have a 'sector' property.
              break;

            case "social_media_trend":
              const smtPayload = payload as SocialMediaTrendPayload;
              let intensityMultiplier = 1;
              if (smtPayload.trendIntensity === "medium") intensityMultiplier = 1.5;
              else if (smtPayload.trendIntensity === "high") intensityMultiplier = 2.5;
              adjustment = sentimentMultiplier * intensityMultiplier * 0.008; // Base 0.8% for social media hype
              stockPriceAdjustments[smtPayload.stockSymbol] = (stockPriceAdjustments[smtPayload.stockSymbol] || 0) + adjustment;
              break;

            case "analyst_rating_change":
              const arcPayload = payload as AnalystRatingChangePayload;
              // More complex logic could compare previousRating and newRating
              adjustment = sentimentMultiplier * 0.015; // Base 1.5% for rating changes
              stockPriceAdjustments[arcPayload.stockSymbol] = (stockPriceAdjustments[arcPayload.stockSymbol] || 0) + adjustment;
              // If priceTarget is available, could also nudge price towards it over time (more complex)
              break;
          }
        });
        // --- END: Event-driven impact calculation ---

        // 1. Update stock prices (using 'prev' for consistency with price updates)
        const updatedStocks = prev.stocks.map(stock => {
          // a. Base random walk (intrinsic volatility + market conditions)
          let priceChangeFactor = (Math.random() - 0.5) * stock.volatility; // Random factor based on stock's own volatility
          if (prev.marketConditions.trend === "bullish") priceChangeFactor += 0.05 * stock.volatility; // Trend influence
          else if (prev.marketConditions.trend === "bearish") priceChangeFactor -= 0.05 * stock.volatility;
          priceChangeFactor *= prev.marketConditions.volatility; // Amplify by overall market volatility

          // b. Apply event-driven adjustments
          const eventAdjustmentFactor = stockPriceAdjustments[stock.symbol] || 0;

          // Total change factor for this tick
          const totalChangeFactor = priceChangeFactor + eventAdjustmentFactor;

          // Calculate new price based on the factor relative to current price
          let newPrice = stock.price * (1 + totalChangeFactor);
          newPrice = Math.max(0.01, newPrice); // Ensure price doesn't go below $0.01

          const newHistory = [...stock.history, { date: Date.now(), price: newPrice }].slice(-50);
          return { ...stock, price: newPrice, history: newHistory };
        });

        const tickEvent: GameEvent = {
          id: `tick-${newTick}`, type: "tick", timestamp: Date.now(),
        };

        // Listeners are notified via dispatchEvent, so tickEvent needs to go through it too.
        // However, dispatchEvent updates 'events' array. If we want tickEvent also in listeners
        // but not necessarily duplicated in the main 'events' array from this path,
        // we could call listeners directly. For simplicity, dispatching it.
        dispatchEvent(tickEvent); // This will add tickEvent to the event queue

        // The 'events' array in 'prev' already contains events dispatched by generators this cycle.
        // dispatchEvent for tickEvent will add it to that.
        return {
          ...prev, // This includes events dispatched by generators
          tick: newTick,
          stocks: updatedStocks,
          // 'events' in 'prev' is already updated by dispatchEvent calls from generators and the tickEvent itself.
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchEvent, state.tick]); // state.tick is needed to ensure currentStateForGeneration is fresh. dispatchEvent is stable.

  const executeBuyOrder = useCallback((stockSymbol: string, quantity: number, price: number): boolean => {
    if (!portfolioContext) return false;
    const result = portfolioContext.addToPortfolio(stockSymbol, quantity, price);

    if (result.success) {
      let priceChangeApplied = 0;
      let volatilityChangeApplied = 0;

      setState(prev => {
        const stockIndex = prev.stocks.findIndex(s => s.symbol === stockSymbol);
        if (stockIndex === -1) return prev;

        const updatedStocks = [...prev.stocks];
        const stockCurrentPrice = updatedStocks[stockIndex].price;
        priceChangeApplied = 0.01 * Math.log10(quantity + 1) * stockCurrentPrice;
        updatedStocks[stockIndex] = {
          ...updatedStocks[stockIndex],
          price: Math.max(0.01, stockCurrentPrice + priceChangeApplied),
        };

        volatilityChangeApplied = 0.0005 * Math.log10(quantity + 1);
        const newMarketVolatility = Math.max(0.1, prev.marketConditions.volatility + volatilityChangeApplied);

        return {
          ...prev,
          stocks: updatedStocks,
          marketConditions: {
            ...prev.marketConditions,
            volatility: newMarketVolatility,
          }
        };
      });

      const tradeImpactPayload: PlayerTradeImpactPayload = {
        stockSymbol,
        tradeAction: "buy",
        quantity,
        tradePrice: price,
        priceChangeApplied,
        volatilityChangeApplied,
      };
      dispatchEvent({
        id: `player-trade-impact-buy-${stockSymbol}-${Date.now()}`,
        type: "player_trade_impact",
        payload: tradeImpactPayload,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }, [portfolioContext, dispatchEvent]);

  const executeSellOrder = useCallback((stockSymbol: string, quantity: number, price: number): boolean => {
    if (!portfolioContext) return false;
    const result = portfolioContext.removeFromPortfolio(stockSymbol, quantity, price);

    if (result.success) {
      let priceChangeApplied = 0;
      let volatilityChangeApplied = 0;

      setState(prev => {
        const stockIndex = prev.stocks.findIndex(s => s.symbol === stockSymbol);
        if (stockIndex === -1) return prev;

        const updatedStocks = [...prev.stocks];
        const stockCurrentPrice = updatedStocks[stockIndex].price;
        priceChangeApplied = 0.01 * Math.log10(quantity + 1) * stockCurrentPrice;
        updatedStocks[stockIndex] = {
          ...updatedStocks[stockIndex],
          price: Math.max(0.01, stockCurrentPrice - priceChangeApplied),
        };

        volatilityChangeApplied = 0.0005 * Math.log10(quantity + 1);
        const newMarketVolatility = Math.max(0.1, prev.marketConditions.volatility + volatilityChangeApplied);

        return {
          ...prev,
          stocks: updatedStocks,
          marketConditions: {
            ...prev.marketConditions,
            volatility: newMarketVolatility,
          }
        };
      });

      const tradeImpactPayload: PlayerTradeImpactPayload = {
        stockSymbol,
        tradeAction: "sell",
        quantity,
        tradePrice: price,
        priceChangeApplied, // This is the positive value of change, direction implied by sell
        volatilityChangeApplied,
      };
      dispatchEvent({
        id: `player-trade-impact-sell-${stockSymbol}-${Date.now()}`,
        type: "player_trade_impact",
        payload: tradeImpactPayload,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }, [portfolioContext, dispatchEvent]);

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
