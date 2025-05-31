"use client"

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { fetcher } from '@/lib/api'; // Assuming fetcher is in lib/api.ts
import { NewsEvent as ApiNewsEvent } from '@/lib/models'; // Renamed to avoid conflict
// Stock model is imported but not directly used in this file in the provided code,
// but it's good practice to keep it if it was intended for future use or if other parts of the context might need it.
// import { Stock } from '@/lib/models';


// Types for game phases, events, and engine state
export type GamePhase = "pre-market" | "open" | "close" | "post-market";
export type GameEventType =
  | "market_news"
  | "random_event"
  | "achievement"
  | "tick_advanced" // Changed from "tick" to be more specific about API driven tick
  | "challenge"
  | "milestone"
  | "player_level_up"
  | "xp_gain"
  | "initial_state_loaded";

export interface GameEvent {
  id: string;
  type: GameEventType;
  payload?: any;
  timestamp: number;
}

// Utility functions (createLevelUpEvent, etc.) remain the same...
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
  marketConditions: { // This might also come from the API in the future
    volatility: number;
    trend: "bullish" | "bearish" | "neutral";
  };
  isLoading: boolean; // To track initial load
}

interface GameEngineContextType {
  state: GameEngineState;
  dispatchEvent: (event: GameEvent) => void;
  subscribe: (listener: (event: GameEvent) => void) => () => void;
  advanceTick: () => Promise<void>; // New function to advance the tick
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined);

export function GameEngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameEngineState>({
    tick: 0,
    phase: "pre-market",
    events: [],
    marketConditions: {
      volatility: 1, // Default, could be updated by API
      trend: "neutral", // Default, could be updated by API
    },
    isLoading: true,
  });

  const listeners = useRef<((event: GameEvent) => void)[]>([]);

  const dispatchEvent = useCallback((event: GameEvent) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, event].slice(-100), // Keep last 100 events
    }));
    listeners.current.forEach(fn => fn(event));
  }, []);

  // Fetch initial game state
  useEffect(() => {
    async function loadInitialState() {
      setState(prev => ({ ...prev, isLoading: true })); // Set loading true at the start
      try {
        // Assuming GET /api/tick returns { tick: number, newsEvents: ApiNewsEvent[], stocks: Stock[], player: Player }
        // The provided code only uses tick and newsEvents from the GET for now.
        const initialState = await fetcher<{ tick: number, newsEvents: ApiNewsEvent[], stocks: any[], player: any }>('/api/tick'); // Using GET
        setState(prev => ({
          ...prev,
          tick: initialState.tick,
          isLoading: false,
        }));

        // Dispatch an event indicating initial state is loaded
        dispatchEvent({
          id: `initial-state-loaded-${Date.now()}`,
          type: "initial_state_loaded",
          payload: { tick: initialState.tick, initialNews: initialState.newsEvents }, // include initial news if needed
          timestamp: Date.now(),
        });

      } catch (error) {
        console.error("Failed to load initial game state:", error);
        setState(prev => ({ ...prev, isLoading: false }));
        // Handle error appropriately, maybe set an error state or dispatch an error event
      }
    }
    loadInitialState();
  }, [dispatchEvent]); // dispatchEvent is stable due to useCallback

  // Advance tick by calling the API
  const advanceTick = useCallback(async () => {
    try {
      const response = await fetcher<{ tick: number, stocks: any[], newsEvent: ApiNewsEvent | null }>('/api/tick', {
        method: 'POST',
      });

      setState(prev => ({
        ...prev,
        tick: response.tick,
      }));

      // Dispatch a tick_advanced event
      const tickAdvancedEvent: GameEvent = {
        id: `tick-advanced-${response.tick}-${Date.now()}`, // Added Date.now() for more unique ID
        type: "tick_advanced",
        payload: { newTick: response.tick, stocks: response.stocks }, // Include stocks in payload
        timestamp: Date.now(),
      };
      dispatchEvent(tickAdvancedEvent);

      // If a news event occurred during the tick, dispatch it
      if (response.newsEvent) {
        const marketNewsGameEvent: GameEvent = {
          id: response.newsEvent.id, // Use ID from API
          type: "market_news",
          payload: response.newsEvent, // The whole news event object from API
          timestamp: new Date(response.newsEvent.timestamp).getTime(),
        };
        dispatchEvent(marketNewsGameEvent);
      }
      // Stock data is in response.stocks, and now included in tick_advanced event payload.
      // Components interested in stocks can listen for 'tick_advanced'

    } catch (error) {
      console.error("Failed to advance tick:", error);
      // Handle error, maybe dispatch an error event
    }
  }, [dispatchEvent]);

  const subscribe = useCallback((listener: (event: GameEvent) => void) => {
    listeners.current.push(listener);
    return () => {
      listeners.current = listeners.current.filter(fn => fn !== listener);
    };
  }, []);

  return (
    <GameEngineContext.Provider value={{ state, dispatchEvent, subscribe, advanceTick }}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) throw new Error("useGameEngine must be used within a GameEngineProvider");
  return context;
}
