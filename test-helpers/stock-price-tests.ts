import { Stock, GameEngineState, GamePhase } from '../contexts/game-engine-context'; // Adjust path as needed

// This is the core logic duplicated from GameEngineProvider for testing purposes.
// In a real test environment, you'd export this logic from your main code or test it directly.
function calculateNextStockPrice(stock: Stock, marketConditions: GameEngineState['marketConditions']): number {
  let priceChange = (Math.random() - 0.5) * stock.volatility; // Base change

  if (marketConditions.trend === "bullish") {
    priceChange += 0.1 * stock.volatility;
  } else if (marketConditions.trend === "bearish") {
    priceChange -= 0.1 * stock.volatility;
  }

  priceChange *= marketConditions.volatility;
  let newPrice = stock.price + priceChange;
  newPrice = Math.max(0.01, newPrice); // Ensure price doesn't go below $0.01
  return newPrice;
}

// --- Test Scenarios ---

console.log("--- Stock Price Calculation Tests ---");

// Scenario 1: Neutral market, moderate volatility
const stock1: Stock = { id: "S1", name: "TestStock1", symbol: "TS1", price: 100, volatility: 0.5, history: [] };
const market1: GameEngineState['marketConditions'] = { volatility: 1, trend: "neutral" };
const nextPrice1_runs: number[] = [];
for (let i = 0; i < 5; i++) nextPrice1_runs.push(calculateNextStockPrice(stock1, market1));
console.log(`Scenario 1 (Neutral): Stock ${stock1.symbol} @ ${stock1.price}, Vol: ${stock1.volatility}, Market Vol: ${market1.volatility}, Trend: ${market1.trend}`);
nextPrice1_runs.forEach((p, i) => console.log(`  Run ${i+1}: ${p.toFixed(2)}`));
// Expected: Prices should fluctuate around 100. Max deviation roughly +/- 0.25 ( (0.5 * 0.5) * 1 )

// Scenario 2: Bullish market, high volatility
const stock2: Stock = { id: "S2", name: "TestStock2", symbol: "TS2", price: 200, volatility: 1.0, history: [] };
const market2: GameEngineState['marketConditions'] = { volatility: 1.5, trend: "bullish" };
const nextPrice2_runs: number[] = [];
for (let i = 0; i < 5; i++) nextPrice2_runs.push(calculateNextStockPrice(stock2, market2));
console.log(`\nScenario 2 (Bullish): Stock ${stock2.symbol} @ ${stock2.price}, Vol: ${stock2.volatility}, Market Vol: ${market2.volatility}, Trend: ${market2.trend}`);
nextPrice2_runs.forEach((p, i) => console.log(`  Run ${i+1}: ${p.toFixed(2)}`));
// Expected: Prices should generally trend upwards and have larger swings.
// Base random part: +/- (0.5 * 1.0 * 1.5) = +/- 0.75
// Bullish part: +(0.1 * 1.0 * 1.5) = +0.15
// Total expected change range roughly: -0.60 to +0.90 relative to original price of 200.

// Scenario 3: Bearish market, low stock volatility, low market volatility
const stock3: Stock = { id: "S3", name: "TestStock3", symbol: "TS3", price: 50, volatility: 0.2, history: [] };
const market3: GameEngineState['marketConditions'] = { volatility: 0.8, trend: "bearish" };
const nextPrice3_runs: number[] = [];
for (let i = 0; i < 5; i++) nextPrice3_runs.push(calculateNextStockPrice(stock3, market3));
console.log(`\nScenario 3 (Bearish): Stock ${stock3.symbol} @ ${stock3.price}, Vol: ${stock3.volatility}, Market Vol: ${market3.volatility}, Trend: ${market3.trend}`);
nextPrice3_runs.forEach((p, i) => console.log(`  Run ${i+1}: ${p.toFixed(2)}`));
// Expected: Prices should generally trend downwards, with smaller swings.
// Base random part: +/- (0.5 * 0.2 * 0.8) = +/- 0.08
// Bearish part: -(0.1 * 0.2 * 0.8) = -0.016
// Total expected change range roughly: -0.096 to +0.064 relative to original price of 50.

// --- Trade Impact Test (Conceptual) ---
console.log("\n--- Trade Impact on Price & Volatility (Conceptual) ---");

function applyTradeImpact(
  stockPrice: number,
  marketVolatility: number,
  quantity: number,
  action: 'buy' | 'sell'
): { newPrice: number, newVolatility: number } {
  const priceImpactFactor = 0.01;
  const volatilityImpactFactor = 0.0005; // smaller factor for volatility

  const logQuantity = Math.log10(quantity + 1);
  const priceImpact = priceImpactFactor * logQuantity * stockPrice; // Impact relative to current price
  const newVolatility = Math.max(0.1, marketVolatility + (volatilityImpactFactor * logQuantity));

  let newPrice;
  if (action === 'buy') {
    newPrice = Math.max(0.01, stockPrice + priceImpact);
  } else { // sell
    newPrice = Math.max(0.01, stockPrice - priceImpact);
  }
  return { newPrice, newVolatility };
}

const initialStockPrice = 100;
const initialMarketVolatility = 1.0;
const tradeQuantity = 50;

// Buy trade
const buyImpact = applyTradeImpact(initialStockPrice, initialMarketVolatility, tradeQuantity, 'buy');
console.log(`Buy Trade Impact: Quantity ${tradeQuantity} on Stock @ ${initialStockPrice}, Market Vol ${initialMarketVolatility}`);
console.log(`  New Price: ${buyImpact.newPrice.toFixed(2)}, New Market Vol: ${buyImpact.newVolatility.toFixed(4)}`);
// Expected: Price increases, volatility increases. (0.01 * log10(51) * 100) approx 1.7 price increase

// Sell trade
const sellImpact = applyTradeImpact(initialStockPrice, initialMarketVolatility, tradeQuantity, 'sell');
console.log(`\nSell Trade Impact: Quantity ${tradeQuantity} on Stock @ ${initialStockPrice}, Market Vol ${initialMarketVolatility}`);
console.log(`  New Price: ${sellImpact.newPrice.toFixed(2)}, New Market Vol: ${sellImpact.newVolatility.toFixed(4)}`);
// Expected: Price decreases, volatility increases. (0.01 * log10(51) * 100) approx 1.7 price decrease

// To run this file (conceptual):
// 1. Save as stock-price-tests.ts in a test-helpers directory.
// 2. Ensure the import path to game-engine-context.ts is correct.
// 3. Compile: `npx tsc test-helpers/stock-price-tests.ts --skipLibCheck` (if not part of a larger project build)
// 4. Run: `node test-helpers/stock-price-tests.js`
// Note: Due to Math.random(), exact price values will vary per run for calculateNextStockPrice.
// The key is to observe if they are within expected ranges and trends.
// Trade impact calculations are deterministic.

export {}; // Make this a module if not already one due to imports
