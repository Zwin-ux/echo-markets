"use client"

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

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

export interface GameEngineState {
  tick: number;
  phase: GamePhase;
  events: GameEvent[];
  marketConditions: {
    volatility: number;
    trend: "bullish" | "bearish" | "neutral";
  };
}

interface GameEngineContextType {
  state: GameEngineState;
  dispatchEvent: (event: GameEvent) => void;
  subscribe: (listener: (event: GameEvent) => void) => () => void;
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined);

export function GameEngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameEngineState>({
    tick: 0,
    phase: "pre-market",
    events: [],
    marketConditions: {
      volatility: 1,
      trend: "neutral",
    },
  });

  const listeners = useRef<((event: GameEvent) => void)[]>([]);

  // Game loop: advances tick and triggers tick events
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const newTick = prev.tick + 1;
        const event: GameEvent = {
          id: `tick-${newTick}`,
          type: "tick",
          timestamp: Date.now(),
        };
        // Notify listeners
        listeners.current.forEach(fn => fn(event));
        return {
          ...prev,
          tick: newTick,
          events: [...prev.events, event].slice(-100),
        };
      });
    }, 2000); // 2s per tick, adjustable
    return () => clearInterval(interval);
  }, []);

  // Dispatch a custom event
  const dispatchEvent = useCallback((event: GameEvent) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, event].slice(-100),
    }));
    listeners.current.forEach(fn => fn(event));
  }, []);

  // Subscribe to events
  const subscribe = useCallback((listener: (event: GameEvent) => void) => {
    listeners.current.push(listener);
    return () => {
      listeners.current = listeners.current.filter(fn => fn !== listener);
    };
  }, []);

  // Example: trigger a random market event every 10 ticks
  useEffect(() => {
    if (state.tick > 0 && state.tick % 10 === 0) {
      const randomEvent: GameEvent = {
        id: `market-event-${state.tick}`,
        type: "market_news",
        payload: {
          headline: "Unexpected market event!",
          impact: Math.random() > 0.5 ? "positive" : "negative",
        },
        timestamp: Date.now(),
      };
      dispatchEvent(randomEvent);
    }
  }, [state.tick, dispatchEvent]);

  return (
    <GameEngineContext.Provider value={{ state, dispatchEvent, subscribe }}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) throw new Error("useGameEngine must be used within a GameEngineProvider");
  return context;
}
