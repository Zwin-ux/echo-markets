"use client"

import { useState, useEffect, useMemo } from "react"
import { Newspaper, Maximize2, Minimize2, X, RefreshCw, Building2, BarChart2, MessageSquare, TrendingUp as RatingIcon } from "lucide-react"
import {
  useGameEngine,
  GameEvent,
  MarketNewsArticle,
  CompanyNewsPayload,
  EconomicIndicatorPayload,
  SocialMediaTrendPayload,
  AnalystRatingChangePayload,
  // PlayerTradeImpactPayload, // Not typically shown in news feed
} from "@/contexts/game-engine-context"

const NEWSWORTHY_EVENT_TYPES: GameEvent['type'][] = [
  "market_news",
  "company_news",
  "economic_indicator",
  "social_media_trend",
  "analyst_rating_change",
  "regulatory_change" // Assuming this might be added later
];

function getSentimentColor(sentiment: string | undefined): string {
  switch (sentiment) {
    case "positive": return "text-green-400";
    case "negative": return "text-red-400";
    case "neutral": return "text-blue-400";
    case "mixed": return "text-yellow-400";
    default: return "text-gray-400";
  }
}

function getSentimentBgColor(sentiment: string | undefined): string {
  switch (sentiment) {
    case "positive": return "bg-green-500/20";
    case "negative": return "bg-red-500/20";
    case "neutral": return "bg-blue-500/20";
    case "mixed": return "bg-yellow-500/20";
    default: return "bg-gray-500/20";
  }
}


export default function NewsFeedModule() {
  const { state: engineState } = useGameEngine();
  const [isMaximized, setIsMaximized] = useState(false);

  const newsEvents = useMemo(() => {
    return [...engineState.events, ...engineState.marketNews.map(article => ({
        id: article.id,
        type: 'market_news' as GameEvent['type'], // Cast because marketNews is separate
        payload: article,
        timestamp: article.timestamp,
    }))]
    .filter(event => NEWSWORTHY_EVENT_TYPES.includes(event.type))
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
    .slice(0, 50); // Keep last 50 news-worthy events
  }, [engineState.events, engineState.marketNews]);


  const renderEventItem = (event: GameEvent) => {
    const payload = event.payload;
    let icon = <Newspaper size={16} className="mr-2 text-gray-500" />;
    let title = `Event: ${event.type}`;
    let details = <pre className="text-xs bg-gray-700 p-1 rounded overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
    let sentimentText = "";
    let sentimentClass = "";

    switch (event.type) {
      case "market_news":
        const article = payload as MarketNewsArticle;
        icon = <Newspaper size={16} className="mr-2 text-blue-400" />;
        title = article.headline;
        details = <p className="text-xs text-gray-400">{article.content.substring(0, 100)}...</p>;
        sentimentText = article.impact?.sentiment || "neutral";
        sentimentClass = getSentimentColor(sentimentText);
        break;
      case "company_news":
        const cn = payload as CompanyNewsPayload;
        icon = <Building2 size={16} className="mr-2 text-purple-400" />;
        title = `${cn.stockSymbol}: ${cn.headline}`;
        details = <p className="text-xs text-gray-400">Impact: {cn.impactMagnitude.toFixed(2)}</p>;
        sentimentText = cn.sentiment;
        sentimentClass = getSentimentColor(sentimentText);
        break;
      case "economic_indicator":
        const ei = payload as EconomicIndicatorPayload;
        icon = <BarChart2 size={16} className="mr-2 text-orange-400" />;
        title = `${ei.indicatorName}: ${ei.value} (${ei.changeDirection || 'stable'})`;
        details = <p className="text-xs text-gray-400">Scope: {ei.impactScope} {ei.affectedSector ? `(${ei.affectedSector})` : ''}</p>;
        sentimentText = ei.sentiment;
        sentimentClass = getSentimentColor(sentimentText);
        break;
      case "social_media_trend":
        const smt = payload as SocialMediaTrendPayload;
        icon = <MessageSquare size={16} className="mr-2 text-teal-400" />;
        title = `${smt.stockSymbol} trending on ${smt.source || 'social media'}`;
        details = <p className="text-xs text-gray-400">Intensity: {smt.trendIntensity}</p>;
        sentimentText = smt.sentiment;
        sentimentClass = getSentimentColor(sentimentText);
        break;
      case "analyst_rating_change":
        const arc = payload as AnalystRatingChangePayload;
        icon = <RatingIcon size={16} className="mr-2 text-indigo-400" />;
        title = `${arc.stockSymbol} rating by ${arc.analystFirm}`;
        details = (
          <p className="text-xs text-gray-400">
            {arc.previousRating ? `${arc.previousRating} → ` : ''}{arc.newRating}
            {arc.priceTarget ? ` (PT: $${arc.priceTarget.toFixed(2)})` : ''}
          </p>
        );
        sentimentText = arc.sentiment;
        sentimentClass = getSentimentColor(sentimentText);
        break;
      // Add cases for other newsworthy events like 'regulatory_change'
      default:
        // Fallback for any other newsworthy types not explicitly handled
        details = <p className="text-xs text-gray-400">Details: {JSON.stringify(payload, null, 1).substring(0,100)}...</p>;
        break;
    }

    return (
      <div key={event.id} className="p-3 hover:bg-green-500/5">
        <div className="flex items-start mb-1">
          {icon}
          <div className="flex-1">
            <div className="flex justify-between items-center">
                <div className="text-sm font-semibold">{title}</div>
                {sentimentText && (
                    <div className={`text-xs px-1.5 py-0.5 rounded ${getSentimentBgColor(sentimentText)} ${sentimentClass}`}>
                        {sentimentText.charAt(0).toUpperCase() + sentimentText.slice(1)}
                    </div>
                )}
            </div>
            {details}
          </div>
        </div>
        <div className="text-xs text-green-500/70 text-right">
          {new Date(event.timestamp).toLocaleTimeString()} - {new Date(event.timestamp).toLocaleDateString()}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden ${isMaximized ? 'fixed inset-0 z-50' : 'relative'}`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Newspaper size={14} className="mr-2" />
          <span className="text-xs font-semibold">NEWS_FEED</span>
        </div>
        <div className="flex space-x-1">
          <button className="p-1 hover:bg-green-500/20 rounded" title="Refresh (uses live data)">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded" title={isMaximized ? "Minimize" : "Maximize"}>
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {newsEvents.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No news events available.</div>
        ) : (
          <div className="divide-y divide-green-500/20">
            {newsEvents.map(renderEventItem)}
          </div>
        )}
      </div>
    </div>
  )
}
