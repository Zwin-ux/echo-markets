import {
    Stock,
    GameEngineState,
    GameEvent,
    CompanyNewsPayload,
    EconomicIndicatorPayload,
    SocialMediaTrendPayload,
    AnalystRatingChangePayload
} from '../contexts/game-engine-context'; // Adjust path as needed

// --- Helper: Simplified Price Update Logic (from GameEngineProvider) ---
// This focuses on applying event adjustments and a minimal random walk.
// The full version in GameEngineProvider has more complete random walk and market trend logic.

function calculatePriceAdjustmentsFromEvents(
    stocks: Stock[],
    events: GameEvent[]
): Record<string, number> {
    const stockPriceAdjustments: Record<string, number> = {};

    events.forEach(event => {
        const payload = event.payload;
        let adjustment = 0;
        let sentimentMultiplier = 0;

        if (payload.sentiment === "positive") sentimentMultiplier = 1;
        else if (payload.sentiment === "negative") sentimentMultiplier = -1;
        else if (payload.sentiment === "mixed") sentimentMultiplier = (Math.random() - 0.5) * 0.5;

        switch (event.type) {
            case "company_news":
                const cnPayload = payload as CompanyNewsPayload;
                adjustment = sentimentMultiplier * cnPayload.impactMagnitude * 0.05; // Base 5%
                stockPriceAdjustments[cnPayload.stockSymbol] = (stockPriceAdjustments[cnPayload.stockSymbol] || 0) + adjustment;
                break;
            case "economic_indicator":
                const eiPayload = payload as EconomicIndicatorPayload;
                if (eiPayload.impactScope === "market-wide") {
                    adjustment = sentimentMultiplier * 0.005; // Smaller base 0.5%
                    stocks.forEach(stock => {
                        stockPriceAdjustments[stock.symbol] = (stockPriceAdjustments[stock.symbol] || 0) + adjustment;
                    });
                } else if (eiPayload.impactScope === "stock-specific" && eiPayload.affectedSymbol) {
                    adjustment = sentimentMultiplier * 0.01; // Base 1%
                    stockPriceAdjustments[eiPayload.affectedSymbol] = (stockPriceAdjustments[eiPayload.affectedSymbol] || 0) + adjustment;
                }
                break;
            case "social_media_trend":
                const smtPayload = payload as SocialMediaTrendPayload;
                let intensityMultiplier = 1;
                if (smtPayload.trendIntensity === "medium") intensityMultiplier = 1.5;
                else if (smtPayload.trendIntensity === "high") intensityMultiplier = 2.5;
                adjustment = sentimentMultiplier * intensityMultiplier * 0.008; // Base 0.8%
                stockPriceAdjustments[smtPayload.stockSymbol] = (stockPriceAdjustments[smtPayload.stockSymbol] || 0) + adjustment;
                break;
            case "analyst_rating_change":
                const arcPayload = payload as AnalystRatingChangePayload;
                adjustment = sentimentMultiplier * 0.015; // Base 1.5%
                stockPriceAdjustments[arcPayload.stockSymbol] = (stockPriceAdjustments[arcPayload.stockSymbol] || 0) + adjustment;
                break;
        }
    });
    return stockPriceAdjustments;
}

function applyPriceUpdate(
    stock: Stock,
    eventAdjustmentFactor: number,
    marketConditions: GameEngineState['marketConditions']
): number {
    // Simplified base random walk for testing (focus on event impact)
    let priceChangeFactor = (Math.random() - 0.5) * stock.volatility * 0.1; // Reduced random walk for clarity
    if (marketConditions.trend === "bullish") priceChangeFactor += 0.001 * stock.volatility;
    else if (marketConditions.trend === "bearish") priceChangeFactor -= 0.001 * stock.volatility;
    priceChangeFactor *= marketConditions.volatility;

    const totalChangeFactor = priceChangeFactor + eventAdjustmentFactor;
    let newPrice = stock.price * (1 + totalChangeFactor);
    return Math.max(0.01, newPrice);
}

// --- Test Scenarios ---
console.log("--- Event Impact on Stock Price Tests ---");

const mockStocks: Stock[] = [
    { id: "S1", name: "AlphaCorp", symbol: "AC", price: 100, volatility: 0.2, history: [] },
    { id: "S2", name: "BetaInc", symbol: "BI", price: 50, volatility: 0.3, history: [] },
];

const mockMarketConditions: GameEngineState['marketConditions'] = {
    volatility: 1.0, // Neutral market volatility
    trend: "neutral",   // Neutral trend
};

// Scenario 1: Positive Company News for AC
const companyNewsEventPositive: GameEvent = {
    id: "cn1", type: "company_news", timestamp: Date.now(),
    payload: {
        stockSymbol: "AC", headline: "AC announces breakthrough!",
        sentiment: "positive", impactMagnitude: 0.8
    } as CompanyNewsPayload
};
let adjustments1 = calculatePriceAdjustmentsFromEvents(mockStocks, [companyNewsEventPositive]);
let newPriceAC1 = applyPriceUpdate(mockStocks[0], adjustments1["AC"] || 0, mockMarketConditions);
let newPriceBI1 = applyPriceUpdate(mockStocks[1], adjustments1["BI"] || 0, mockMarketConditions);
console.log(`\nScenario 1: Positive Company News for ${mockStocks[0].symbol}`);
console.log(`  ${mockStocks[0].symbol} old price: ${mockStocks[0].price.toFixed(2)}, new price: ${newPriceAC1.toFixed(2)} (Expected significant increase)`);
console.log(`  ${mockStocks[1].symbol} old price: ${mockStocks[1].price.toFixed(2)}, new price: ${newPriceBI1.toFixed(2)} (Expected minimal change from random walk)`);
// Expected: AC price increases noticeably (e.g., 100 * (1 + 1*0.8*0.05) = 104, plus small random walk). BI changes minimally.

// Scenario 2: Negative Economic Indicator (Market-Wide)
const economicEventNegative: GameEvent = {
    id: "econ1", type: "economic_indicator", timestamp: Date.now(),
    payload: {
        indicatorName: "CPI", value: "3.5%", sentiment: "negative", // Higher inflation is bad
        impactScope: "market-wide"
    } as EconomicIndicatorPayload
};
const adjustments2 = calculatePriceAdjustmentsFromEvents(mockStocks, [economicEventNegative]);
const newPriceAC2 = applyPriceUpdate(mockStocks[0], adjustments2["AC"] || 0, mockMarketConditions);
const newPriceBI2 = applyPriceUpdate(mockStocks[1], adjustments2["BI"] || 0, mockMarketConditions);
console.log(`\nScenario 2: Negative Market-Wide Economic Indicator`);
console.log(`  ${mockStocks[0].symbol} old price: ${mockStocks[0].price.toFixed(2)}, new price: ${newPriceAC2.toFixed(2)} (Expected decrease)`);
console.log(`  ${mockStocks[1].symbol} old price: ${mockStocks[1].price.toFixed(2)}, new price: ${newPriceBI2.toFixed(2)} (Expected decrease)`);
// Expected: Both AC and BI prices decrease slightly (e.g., Price * (1 - 1*0.005) = Price * 0.995, plus small random walk).

// Scenario 3: High Intensity Positive Social Media Trend for BI
const socialEventPositive: GameEvent = {
    id: "social1", type: "social_media_trend", timestamp: Date.now(),
    payload: {
        stockSymbol: "BI", trendIntensity: "high", sentiment: "positive", source: "TestPlatform"
    } as SocialMediaTrendPayload
};
const adjustments3 = calculatePriceAdjustmentsFromEvents(mockStocks, [socialEventPositive]);
const newPriceAC3 = applyPriceUpdate(mockStocks[0], adjustments3["AC"] || 0, mockMarketConditions);
const newPriceBI3 = applyPriceUpdate(mockStocks[1], adjustments3["BI"] || 0, mockMarketConditions);
console.log(`\nScenario 3: Positive High-Intensity Social Media Trend for ${mockStocks[1].symbol}`);
console.log(`  ${mockStocks[0].symbol} old price: ${mockStocks[0].price.toFixed(2)}, new price: ${newPriceAC3.toFixed(2)} (Expected minimal change)`);
console.log(`  ${mockStocks[1].symbol} old price: ${mockStocks[1].price.toFixed(2)}, new price: ${newPriceBI3.toFixed(2)} (Expected significant increase)`);
// Expected: BI price increases noticeably (e.g., 50 * (1 + 1*2.5*0.008) = 50 * 1.02 = 51, plus small random walk). AC changes minimally.


// Scenario 4: Analyst Downgrade for AC
const analystEventNegative: GameEvent = {
    id: "analyst1", type: "analyst_rating_change", timestamp: Date.now(),
    payload: {
        stockSymbol: "AC", analystFirm: "TestFirm", newRating: "Sell", sentiment: "negative"
    } as AnalystRatingChangePayload
};
const adjustments4 = calculatePriceAdjustmentsFromEvents(mockStocks, [analystEventNegative]);
const newPriceAC4 = applyPriceUpdate(mockStocks[0], adjustments4["AC"] || 0, mockMarketConditions);
const newPriceBI4 = applyPriceUpdate(mockStocks[1], adjustments4["BI"] || 0, mockMarketConditions);
console.log(`\nScenario 4: Analyst Downgrade for ${mockStocks[0].symbol}`);
console.log(`  ${mockStocks[0].symbol} old price: ${mockStocks[0].price.toFixed(2)}, new price: ${newPriceAC4.toFixed(2)} (Expected decrease)`);
console.log(`  ${mockStocks[1].symbol} old price: ${mockStocks[1].price.toFixed(2)}, new price: ${newPriceBI4.toFixed(2)} (Expected minimal change)`);
// Expected: AC price decreases (e.g., 100 * (1 - 1*0.015) = 98.5, plus small random walk). BI changes minimally.


// Scenario 5: Multiple events affecting one stock
const companyNewsNegativeAC: GameEvent = {
    id: "cn2", type: "company_news", timestamp: Date.now(),
    payload: { stockSymbol: "AC", headline: "AC product recall", sentiment: "negative", impactMagnitude: 0.7 } as CompanyNewsPayload
};
const socialMediaPositiveAC: GameEvent = {
    id: "social2", type: "social_media_trend", timestamp: Date.now(),
    payload: { stockSymbol: "AC", trendIntensity: "medium", sentiment: "positive", source: "OtherPlatform" } as SocialMediaTrendPayload
};
const adjustments5 = calculatePriceAdjustmentsFromEvents(mockStocks, [companyNewsNegativeAC, socialMediaPositiveAC]);
const newPriceAC5 = applyPriceUpdate(mockStocks[0], adjustments5["AC"] || 0, mockMarketConditions);
console.log(`\nScenario 5: Multiple events for ${mockStocks[0].symbol} (Negative News, Positive Social)`);
console.log(`  ${mockStocks[0].symbol} old price: ${mockStocks[0].price.toFixed(2)}, new price: ${newPriceAC5.toFixed(2)}`);
// Expected: Negative news (-1 * 0.7 * 0.05 = -0.035). Positive social (1 * 1.5 * 0.008 = +0.012)
// Net effect: -0.023. So, 100 * (1 - 0.023) = 97.7. Price should decrease.

// To run this file (conceptual):
// 1. Save as event-impact-tests.ts in a test-helpers directory.
// 2. Ensure the import path to game-engine-context.ts is correct.
// 3. Compile: `npx tsc test-helpers/event-impact-tests.ts --skipLibCheck --target esnext --module commonjs` (or similar, ensure imports work)
// 4. Run: `node test-helpers/event-impact-tests.js`
// Note: Due to the simplified random walk, results will still vary slightly but event impacts should be observable.

export {}; // Make this a module
