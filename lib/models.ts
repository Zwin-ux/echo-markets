// lib/models.ts

export interface Stock {
  symbol: string; // e.g., "AAPL", "GME"
  name: string; // e.g., "Apple Inc.", "GameStop Corp."
  price: number; // Current market price
  volatility: number; // A factor representing how much the stock price fluctuates (e.g., 0.05 for 5%)
  momentum: number; // A factor representing the current trend of the stock (e.g., positive for upward, negative for downward)
  last_updated: string; // ISO timestamp
}

export interface NewsEvent {
  id: string; // Unique identifier for the news event
  title: string; // Headline of the news
  body: string; // Detailed description of the event
  impact_score: number; // A number indicating the magnitude and direction of the impact (e.g., positive for good news, negative for bad news)
  target_stocks: string[]; // Array of stock symbols affected by this event
  timestamp: string; // ISO timestamp
}

export interface Player {
  id: string;
  name: string;
  holdings: { [key: string]: number }; // e.g., { "AAPL": 10, "GME": 5 } (maps stock symbol to quantity)
  sentiment_modifiers: { [key: string]: number }; // e.g., { "AAPL": 0.1, "GME": -0.05 } (maps stock symbol to a sentiment score modifier)
}
