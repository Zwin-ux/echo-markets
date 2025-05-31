"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, Maximize2, Minimize2, RefreshCw } from 'lucide-react'; // Removed Filter, ThumbsUp, ThumbsDown, X
import { useGameEngine, GameEvent } from '@/contexts/game-engine-context'; // Import GameEvent
import { NewsEvent } from '@/lib/models'; // Use our NewsEvent model
import { fetcher } from '@/lib/api';

// Define a type for the API response from GET /api/tick for news
interface ApiTickGetResponseForNews {
  newsEvents: NewsEvent[]; // Assuming GET /api/tick returns predefined narrative events here
  // other fields might be present
}

export default function NewsFeedModule() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { subscribe } = useGameEngine(); // Removed engineState as it's not directly used

  const fetchInitialNews = useCallback(async () => {
    setIsLoading(true);
    try {
      // The GET /api/tick endpoint returns all predefined narrativeEvents
      const data = await fetcher<ApiTickGetResponseForNews>('/api/tick');
      // Sort by timestamp descending if not already
      const sortedEvents = data.newsEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNewsEvents(sortedEvents);
    } catch (error) {
      console.error("Failed to fetch initial news:", error);
      // Handle error appropriately, maybe set an error message in state
      setNewsEvents([]); // Clear news events on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialNews();
  }, [fetchInitialNews]);

  useEffect(() => {
    const handleGameEvent = (event: GameEvent) => { // Use GameEvent type
      if (event.type === 'market_news' && event.payload) {
        const newEvent = event.payload as NewsEvent;
        // Add new event to the beginning of the list, ensuring no duplicates if IDs are stable
        setNewsEvents(prevEvents => {
          // Prevent adding duplicate event if it somehow gets dispatched multiple times
          if (prevEvents.find(e => e.id === newEvent.id && e.timestamp === newEvent.timestamp)) {
            return prevEvents;
          }
          return [newEvent, ...prevEvents].slice(0, 50); // Keep last 50 news items
        });
      } else if (event.type === 'initial_state_loaded' && event.payload && event.payload.initialNews) {
        // If initial_state_loaded from GameEngineContext provides news, use it.
        // This might be more efficient than fetchInitialNews if data is already there.
        const initialEvents = event.payload.initialNews as NewsEvent[];
        setNewsEvents(initialEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setIsLoading(false); // News loaded via context event
      }
    };

    const unsubscribe = subscribe(handleGameEvent);
    return () => unsubscribe();
  }, [subscribe, fetchInitialNews]); // Added fetchInitialNews to dependencies, though it might not be strictly needed if initial_state_loaded is robust.


  const getSentimentLabel = (impactScore: number) => {
    if (impactScore > 0.05) return { label: "Strong Positive", color: "text-green-400", bgColor: "bg-green-500/20" };
    if (impactScore > 0) return { label: "Positive", color: "text-green-300", bgColor: "bg-green-500/10" };
    if (impactScore < -0.05) return { label: "Strong Negative", color: "text-red-400", bgColor: "bg-red-500/20" };
    if (impactScore < 0) return { label: "Negative", color: "text-red-300", bgColor: "bg-red-500/10" };
    return { label: "Neutral", color: "text-blue-300", bgColor: "bg-blue-500/10" };
  };

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden ${isMaximized ? 'fixed inset-0 z-50' : 'relative'}`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Newspaper size={14} className="mr-2 text-green-400" />
          <span className="text-xs font-semibold text-green-300">MARKET_NEWS_FEED</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={fetchInitialNews} className="p-1 hover:bg-green-500/20 rounded" title="Refresh News">
            <RefreshCw size={12} className="text-green-400" />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded" title={isMaximized ? "Minimize" : "Maximize"}>
            {isMaximized ? <Minimize2 size={12} className="text-green-400" /> : <Maximize2 size={12} className="text-green-400" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {isLoading && newsEvents.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">Loading news...</div>
        ) : !isLoading && newsEvents.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No news events available.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {newsEvents.map((event) => (
              <div key={event.id + event.timestamp} className="p-3 hover:bg-green-500/5 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-semibold text-green-300">{event.title}</div>
                  <div
                    className={`text-xs px-1.5 py-0.5 rounded-sm ${getSentimentLabel(event.impact_score).bgColor} ${getSentimentLabel(event.impact_score).color}`}
                  >
                    {getSentimentLabel(event.impact_score).label}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-1 leading-relaxed">{event.body}</p>
                <div className="text-xs text-green-500/70">
                  Targets: {event.target_stocks.join(", ")} • {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
         {isLoading && newsEvents.length > 0 && (
          <div className="text-xs text-center py-2 text-green-500/50">Updating news...</div>
        )}
      </div>
    </div>
  );
}
