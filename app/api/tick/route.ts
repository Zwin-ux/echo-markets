import { NextRequest, NextResponse } from 'next/server';
import { Stock, NewsEvent, Player } from '@/lib/models';

// Mock database - In a real application, this would come from a database.
let mockStocks: Stock[] = [
  { symbol: 'ALPHA', name: 'Alpha Corp', price: 150.00, volatility: 0.05, momentum: 0.1, last_updated: new Date().toISOString() },
  { symbol: 'BETA', name: 'Beta Industries', price: 75.50, volatility: 0.08, momentum: -0.05, last_updated: new Date().toISOString() },
  { symbol: 'GAMMA', name: 'Gamma Solutions', price: 220.25, volatility: 0.03, momentum: 0.02, last_updated: new Date().toISOString() },
];

let mockPlayer: Player = {
  id: 'player1',
  name: 'Synth Strider',
  holdings: { 'ALPHA': 10, 'BETA': 20 },
  sentiment_modifiers: { 'ALPHA': 0.01, 'BETA': -0.005, 'GAMMA': 0.002 }, // Small positive or negative impact
};

const narrativeEvents: NewsEvent[] = [
  {
    id: 'event1',
    title: 'ALPHA Corp Announces Breakthrough Technology!',
    body: 'Alpha Corp shares surged today after announcing a revolutionary new technology that promises to change the industry.',
    impact_score: 0.15, // 15% positive impact
    target_stocks: ['ALPHA'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'event2',
    title: 'Regulatory Concerns Hit BETA Industries',
    body: 'Beta Industries faces headwinds as new regulatory concerns cast a shadow over its future prospects.',
    impact_score: -0.10, // 10% negative impact
    target_stocks: ['BETA'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'event3',
    title: 'GAMMA Solutions Reports Better Than Expected Earnings',
    body: 'Gamma Solutions impressed investors with strong quarterly earnings, beating market expectations.',
    impact_score: 0.08, // 8% positive impact
    target_stocks: ['GAMMA'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'event4',
    title: 'Market-Wide Optimism Boosts All Stocks',
    body: 'A wave of optimism sweeps the market, leading to broad gains across most sectors.',
    impact_score: 0.03, // 3% positive impact for all
    target_stocks: ['ALPHA', 'BETA', 'GAMMA'],
    timestamp: new Date().toISOString(),
  }
];

let currentTick = 0;

export async function POST(req: NextRequest) {
  currentTick++;
  let eventThisTick: NewsEvent | null = null;

  // Simple logic to pick one narrative event per tick (can be more sophisticated)
  if (narrativeEvents.length > 0 && Math.random() < 0.3) { // 30% chance of an event
    eventThisTick = narrativeEvents[Math.floor(Math.random() * narrativeEvents.length)];
    eventThisTick.timestamp = new Date().toISOString(); // Update timestamp to current tick
  }

  mockStocks = mockStocks.map(stock => {
    let priceChangeFactor = 0;

    // 1. Apply random volatility
    const volatilityEffect = (Math.random() - 0.5) * stock.volatility; // Random change between -volatility/2 and +volatility/2
    priceChangeFactor += volatilityEffect;

    // 2. Apply narrative event impact
    if (eventThisTick && eventThisTick.target_stocks.includes(stock.symbol)) {
      priceChangeFactor += eventThisTick.impact_score;
    }

    // 3. Apply player sentiment (mocked)
    // For simplicity, we'll use a generic sentiment if not specified for a stock, or a small random factor
    const playerSentiment = mockPlayer.sentiment_modifiers[stock.symbol] || (Math.random() - 0.5) * 0.001; // default tiny random effect
    priceChangeFactor += playerSentiment;

    // Calculate new price
    let newPrice = stock.price * (1 + priceChangeFactor);
    newPrice = Math.max(0.01, newPrice); // Ensure price doesn't go below 0.01

    return {
      ...stock,
      price: parseFloat(newPrice.toFixed(2)),
      last_updated: new Date().toISOString(),
      // Momentum could be updated here based on recent price changes
    };
  });

  return NextResponse.json({
    tick: currentTick,
    stocks: mockStocks,
    newsEvent: eventThisTick,
  });
}

// Optional: GET handler to retrieve current state without advancing tick (for initial load)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    tick: currentTick,
    stocks: mockStocks,
    newsEvents: narrativeEvents, // Send all predefined narrative events for initial display
    player: mockPlayer,
  });
}
