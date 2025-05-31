"use client"

import { useState, useEffect } from "react"
import { Newspaper, Maximize2, Minimize2, X, RefreshCw, Filter, ThumbsUp, ThumbsDown } from "lucide-react"

import { useGameEngine, MarketNewsArticle } from "@/contexts/game-engine-context" // Import MarketNewsArticle

// Remove NewsItem type, liked, disliked properties as they are not in MarketNewsArticle
// The filter categories might also need adjustment or removal if not applicable.

export default function NewsFeedModule() {
  const { state: engineState } = useGameEngine()
  const { marketNews } = engineState

  const [isMaximized, setIsMaximized] = useState(false)
  // For now, removing filter functionality as it's not directly compatible with MarketNewsArticle structure
  // const [activeFilter, setActiveFilter] = useState<string | null>(null)
  // const [showFilters, setShowFilters] = useState(false)

  // Removed mock news data and useEffect that sets it.
  // News now comes from engineState.marketNews

  // Filtering logic would need to be adapted if re-implemented.
  // For now, displaying all news from the engine.
  const displayNews = marketNews // marketNews is already sorted latest first in context

  // Like/Dislike functionality removed for now as it's not part of MarketNewsArticle
  // const handleLike = (id: string) => { ... }
  // const handleDislike = (id: string) => { ... }

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Newspaper size={14} className="mr-2" />
          <span className="text-xs font-semibold">NEWS_FEED</span>
        </div>
        <div className="flex space-x-1">
          {/* Filter button temporarily disabled
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 hover:bg-green-500/20 rounded"
            title="Filter News"
          >
            <Filter size={12} />
          </button> */}
          <button className="p-1 hover:bg-green-500/20 rounded" title="Refresh (currently uses live data)">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          {/* <button className="p-1 hover:bg-green-500/20 rounded"> // X button for closing module, assuming handled by module manager
            <X size={12} />
          </button> */}
        </div>
      </div>

      {/* Filter UI temporarily disabled
      {showFilters && (
        <div className="flex p-2 border-b border-green-500/30 bg-green-500/5">
          ... filter buttons ...
        </div>
      )} */}

      <div className="flex-1 overflow-y-auto">
        {displayNews.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No market news available.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {displayNews.map((item: MarketNewsArticle) => ( // Explicitly type item
              <div key={item.id} className="p-3 hover:bg-green-500/5">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold">{item.headline}</div>
                  {item.impact && (
                    <div
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        item.impact.sentiment === "positive"
                          ? "bg-green-500/20 text-green-400"
                          : item.impact.sentiment === "negative"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400" // Neutral
                      }`}
                    >
                      {item.impact.sentiment.charAt(0).toUpperCase() + item.impact.sentiment.slice(1)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-green-500/80 mb-1">{item.content.substring(0, 150)}...</p> {/* Show snippet of content */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-green-500/70">
                    {new Date(item.timestamp).toLocaleTimeString()} - {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                  {/* Like/Dislike buttons removed for now
                  <div className="flex space-x-2">
                    <button ... ><ThumbsUp size={12} /></button>
                    <button ... ><ThumbsDown size={12} /></button>
                  </div>
                  */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
