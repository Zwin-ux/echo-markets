"use client"

import { useState, useEffect } from "react"
import { Newspaper, Maximize2, Minimize2, X, RefreshCw, Filter, ThumbsUp, ThumbsDown } from "lucide-react"

type NewsItem = {
  id: number
  title: string
  source: string
  time: string
  sentiment: "positive" | "negative" | "neutral"
  category: "stocks" | "crypto" | "economy" | "tech"
  liked?: boolean
  disliked?: boolean
}

export default function NewsFeedModule() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [news, setNews] = useState<NewsItem[]>([])

  // Mock news data
  useEffect(() => {
    const mockNews: NewsItem[] = [
      {
        id: 1,
        title: "Fed signals potential rate cuts later this year",
        source: "Financial Times",
        time: "2h ago",
        sentiment: "positive",
        category: "economy",
      },
      {
        id: 2,
        title: "Tech stocks rally as AI optimism continues",
        source: "Wall Street Journal",
        time: "3h ago",
        sentiment: "positive",
        category: "stocks",
      },
      {
        id: 3,
        title: "Bitcoin drops below $40k as regulatory concerns mount",
        source: "CoinDesk",
        time: "5h ago",
        sentiment: "negative",
        category: "crypto",
      },
      {
        id: 4,
        title: "Inflation data comes in cooler than expected",
        source: "Bloomberg",
        time: "6h ago",
        sentiment: "positive",
        category: "economy",
      },
      {
        id: 5,
        title: "New AI chip shortage could impact tech sector",
        source: "TechCrunch",
        time: "8h ago",
        sentiment: "negative",
        category: "tech",
      },
      {
        id: 6,
        title: "Retail sales disappoint, consumer spending slows",
        source: "CNBC",
        time: "10h ago",
        sentiment: "negative",
        category: "economy",
      },
      {
        id: 7,
        title: "Ethereum upgrade date confirmed, gas fees expected to drop",
        source: "The Block",
        time: "12h ago",
        sentiment: "positive",
        category: "crypto",
      },
    ]

    setNews(mockNews)
  }, [])

  const filteredNews = activeFilter ? news.filter((item) => item.category === activeFilter) : news

  const handleLike = (id: number) => {
    setNews((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            liked: !item.liked,
            disliked: false,
          }
        }
        return item
      }),
    )
  }

  const handleDislike = (id: number) => {
    setNews((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            disliked: !item.disliked,
            liked: false,
          }
        }
        return item
      }),
    )
  }

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Newspaper size={14} className="mr-2" />
          <span className="text-xs font-semibold">NEWS_FEED</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 hover:bg-green-500/20 rounded"
            title="Filter News"
          >
            <Filter size={12} />
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex p-2 border-b border-green-500/30 bg-green-500/5">
          <button
            onClick={() => setActiveFilter(null)}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === null ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("stocks")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "stocks" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setActiveFilter("crypto")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "crypto" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setActiveFilter("economy")}
            className={`text-xs px-2 py-1 rounded mr-1 ${
              activeFilter === "economy" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Economy
          </button>
          <button
            onClick={() => setActiveFilter("tech")}
            className={`text-xs px-2 py-1 rounded ${
              activeFilter === "tech" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"
            }`}
          >
            Tech
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredNews.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No news matching your filter.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {filteredNews.map((item) => (
              <div key={item.id} className="p-3 hover:bg-green-500/5">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold">{item.title}</div>
                  <div
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      item.sentiment === "positive"
                        ? "bg-green-500/20 text-green-400"
                        : item.sentiment === "negative"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {item.sentiment === "positive" ? "Bullish" : item.sentiment === "negative" ? "Bearish" : "Neutral"}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-green-500/70">
                    {item.source} • {item.time}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`p-1 rounded ${item.liked ? "bg-green-500/30" : "hover:bg-green-500/10"}`}
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => handleDislike(item.id)}
                      className={`p-1 rounded ${item.disliked ? "bg-red-500/30" : "hover:bg-red-500/10"}`}
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
