"use client"

import { createContext, useContext, type ReactNode } from "react"
import { usePortfolio } from "@/contexts/portfolio-context"

type CommandContextType = {
  executeCommand: (command: string) => string
}

const CommandContext = createContext<CommandContextType | undefined>(undefined)

export function CommandProvider({ children }: { children: ReactNode }) {
  const { portfolio, addToPortfolio, removeFromPortfolio, addToWatchlist } = usePortfolio()

  const executeCommand = (command: string): string => {
    const cmd = command.toLowerCase().trim()

    // Help command
    if (cmd === "help") {
      return `
Available commands:
- help: Show this help message
- show [index]: Display market data (e.g., show sp500, show nasdaq)
- compare [a] vs [b]: Compare two markets or indicators
- explain [term]: Get explanation of financial term
- meme: Generate a financial meme
- drama: Show current market drama score
- clear: Clear terminal history

Portfolio commands:
- portfolio: Show your current portfolio
- buy [symbol] [amount]: Buy a stock (e.g., buy aapl 10)
- sell [symbol] [amount]: Sell a stock (e.g., sell aapl 5)
- watchlist [add/remove] [symbol]: Manage your watchlist
- alert [symbol] [price]: Set price alert

Other commands:
- news [topic]: Get latest news (e.g., news crypto)
- social [symbol]: Show social sentiment
- trade [symbol] [buy/sell] [amount]: Execute simulated trade
      `
    }

    // Show command
    if (cmd.startsWith("show ")) {
      const index = cmd.substring(5)

      if (index === "sp500" || index === "s&p500" || index === "s&p") {
        return "S&P 500: 4,327.12 (-1.2%) | YTD: +12.4% | P/E: 21.3 | Volatility: High"
      }

      if (index === "nasdaq" || index === "ndx") {
        return "NASDAQ: 14,723.45 (+0.8%) | YTD: +18.7% | Tech-heavy index mooning frfr"
      }

      if (index === "btc" || index === "bitcoin") {
        return "Bitcoin: $43,215.67 (+3.4%) | 24h Vol: $28.5B | No cap, still volatile | Social Sentiment: Bullish"
      }

      if (index === "fed" || index === "rates") {
        return "Fed Funds Rate: 5.25-5.50% | Next meeting: In 15 days | Market pricing in 0% chance of hike | Yield Curve: Inverted"
      }

      if (index === "portfolio") {
        if (portfolio.holdings.length === 0) {
          return "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
        }

        return `Your Portfolio:
${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}
Total Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}
Cash: $${portfolio.cash.toFixed(2)}
`
      }

      if (index === "watchlist") {
        if (portfolio.watchlist.length === 0) {
          return "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks."
        }

        return `Your Watchlist:
${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price} (${w.change > 0 ? "+" : ""}${w.change}%)`).join("\n")}
`
      }

      return `Unknown index: ${index}. Try 'show sp500' or 'show nasdaq'`
    }

    // Compare command
    if (cmd.startsWith("compare ")) {
      const parts = cmd.substring(8).split(" vs ")
      if (parts.length === 2) {
        const [a, b] = parts
        return `Comparison: ${a.toUpperCase()} vs ${b.toUpperCase()}
${a.toUpperCase()}: +12.4% YTD | Volatility: Medium | P/E: 21.3
${b.toUpperCase()}: +8.7% YTD | Volatility: Low | P/E: 18.5
Correlation: 0.72 (strong)
Relative Strength: ${a.toUpperCase()} outperforming ${b.toUpperCase()} by 3.7%
Social Sentiment: ${a.toUpperCase()} more popular on social media
Institutional Flows: More inflows to ${b.toUpperCase()} in last 30 days`
      }
      return "Invalid comparison format. Try 'compare us vs jp debt'"
    }

    // Explain command
    if (cmd.startsWith("explain ")) {
      const term = cmd.substring(8)

      if (term === "fed" || term === "federal reserve") {
        return "The Fed is basically your rich friend who keeps bailing you out. They control interest rates and money supply to manage inflation and employment. When they print money, stocks usually go up. When they raise rates, your mortgage gets expensive."
      }

      if (term === "inflation") {
        return "Inflation is when your money buys less stuff over time. Like how a $5 latte used to be $3. The Fed tries to keep it around 2%, but sometimes it gets spicy and they have to step in."
      }

      if (term === "recession") {
        return "Recession is when the economy takes an L for at least 6 months. GDP drops, people lose jobs, and everyone gets all doom and gloom. Usually happens every 7-10 years, but timing it is nearly impossible."
      }

      if (term === "yield curve") {
        return "Yield curve is the plot twist in the bond market story. Normally, lending money for longer = more interest (upward curve). When short-term rates > long-term rates, the curve inverts, which is basically the market saying 'recession coming soon, bro' with surprising accuracy."
      }

      if (term === "options") {
        return "Options are like financial lottery tickets on steroids. Calls = betting stonk go up. Puts = betting stonk go down. They let you control 100 shares with way less money, but expire worthless if you're wrong. Basically how WSB users either buy Lambos or lose their life savings."
      }

      if (term === "etf") {
        return "ETFs are like Spotify playlists but for stocks. Instead of picking individual bangers (stocks), you get the whole vibe (market). They trade like stocks but contain many companies, so when one artist flops, the whole playlist doesn't tank. Perfect for people who can't be bothered to research companies."
      }

      return `No explanation found for '${term}'. Try 'explain fed', 'explain inflation', or 'explain options'`
    }

    // Portfolio commands
    if (cmd === "portfolio") {
      if (portfolio.holdings.length === 0) {
        return "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
      }

      return `Your Portfolio:
${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}
Total Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}
Cash: $${portfolio.cash.toFixed(2)}
`
    }

    if (cmd.startsWith("buy ")) {
      const parts = cmd.substring(4).trim().split(" ")
      if (parts.length < 2) return "Invalid format. Use 'buy [symbol] [amount]'"

      const symbol = parts[0].toUpperCase()
      const amount = Number.parseInt(parts[1])

      if (isNaN(amount) || amount <= 0) return "Invalid amount. Please enter a positive number."

      // Mock price generation
      const price = Math.floor(Math.random() * 500) + 50
      const totalCost = price * amount

      if (totalCost > portfolio.cash) {
        return `Insufficient funds. You need $${totalCost.toFixed(2)} but have $${portfolio.cash.toFixed(2)}`
      }

      addToPortfolio(symbol, amount, price)
      return `Bought ${amount} shares of ${symbol} at $${price} for a total of $${totalCost.toFixed(2)}`
    }

    if (cmd.startsWith("sell ")) {
      const parts = cmd.substring(5).trim().split(" ")
      if (parts.length < 2) return "Invalid format. Use 'sell [symbol] [amount]'"

      const symbol = parts[0].toUpperCase()
      const amount = Number.parseInt(parts[1])

      if (isNaN(amount) || amount <= 0) return "Invalid amount. Please enter a positive number."

      const holding = portfolio.holdings.find((h) => h.symbol === symbol)
      if (!holding) return `You don't own any shares of ${symbol}`
      if (holding.shares < amount) return `You only have ${holding.shares} shares of ${symbol}`

      removeFromPortfolio(symbol, amount, holding.currentPrice)
      return `Sold ${amount} shares of ${symbol} at $${holding.currentPrice} for a total of $${(holding.currentPrice * amount).toFixed(2)}`
    }

    if (cmd.startsWith("watchlist ")) {
      const parts = cmd.substring(10).trim().split(" ")
      if (parts.length < 2) return "Invalid format. Use 'watchlist [add/remove] [symbol]'"

      const action = parts[0].toLowerCase()
      const symbol = parts[1].toUpperCase()

      if (action === "add") {
        if (portfolio.watchlist.some((w) => w.symbol === symbol)) {
          return `${symbol} is already in your watchlist`
        }

        // Mock price and change
        const price = Math.floor(Math.random() * 500) + 50
        const change = (Math.random() * 10 - 5).toFixed(2)

        addToWatchlist(symbol, price, Number.parseFloat(change))
        return `Added ${symbol} to your watchlist at $${price}`
      }

      if (action === "remove") {
        if (!portfolio.watchlist.some((w) => w.symbol === symbol)) {
          return `${symbol} is not in your watchlist`
        }

        // Implementation would remove from watchlist
        return `Removed ${symbol} from your watchlist`
      }

      return "Invalid action. Use 'add' or 'remove'"
    }

    // News command
    if (cmd.startsWith("news ")) {
      const topic = cmd.substring(5).trim()

      if (topic === "crypto") {
        return `Latest Crypto News:
- Bitcoin breaks $45k resistance level, bulls taking victory lap
- Ethereum merge 2.0 announced, gas fees still astronomical
- New meme coin "PEPE" up 420%, absolutely no fundamentals
- SEC chair spotted actually learning how blockchain works`
      }

      if (topic === "stocks" || topic === "market") {
        return `Latest Market News:
- Tech stocks rally despite CEO Twitter drama
- Fed minutes reveal officials argued about rate cuts, shocking no one
- Retail investors pile into AI stocks, institutional investors quietly selling
- Earnings season: 80% of companies beat lowered expectations, stonks go up`
      }

      if (topic === "economy") {
        return `Latest Economic News:
- Inflation cools to 3.2%, still spicy compared to Fed target
- Job market remains resilient, recession predictions in shambles
- Housing market: millennials still can't afford homes, boomers confused why
- Consumer sentiment improves as gas prices drop slightly`
      }

      return `No recent news found for '${topic}'. Try 'news crypto', 'news stocks', or 'news economy'`
    }

    // Social sentiment command
    if (cmd.startsWith("social ")) {
      const symbol = cmd.substring(7).trim().toUpperCase()

      // Mock social sentiment data
      const sentiment = Math.random() > 0.5 ? "Bullish" : "Bearish"
      const mentions = Math.floor(Math.random() * 10000)
      const trending = Math.random() > 0.7

      return `Social Sentiment for ${symbol}:
Overall: ${sentiment}
Mentions: ${mentions} in last 24h ${trending ? "(trending ⬆️)" : ""}
Top Platform: ${Math.random() > 0.5 ? "Twitter" : "Reddit"}
Common Phrases: "${symbol} to the moon", "buying the dip", "diamond hands"
Sentiment Change: ${Math.random() > 0.5 ? "Improving" : "Deteriorating"} over last 7 days`
    }

    // Meme command
    if (cmd === "meme") {
      const memes = [
        "🚀 POV: You bought the dip but it keeps dipping\n\nMarket: 'And I took that personally'",
        "When you finally sell for a loss and the stock immediately rebounds:\n\n'I'm never going to financially recover from this'",
        "Fed Chair: 'Inflation is transitory'\n\nNarrator: 'It was not transitory'",
        "No one:\nAbsolutely no one:\nWSB: 'YOLO'd my life savings into 0DTE options'",
        "My portfolio: *drops 20%*\nMe: 'I'm in it for the long term anyway'",
      ]

      return memes[Math.floor(Math.random() * memes.length)]
    }

    // Drama command
    if (cmd === "drama") {
      return "DRAMA SCORE: HIGH\nCauses: Tech CEO Twitter beef, Fed comments, Earnings misses\nVibe Check: Chaotic neutral with a side of FOMO\nMarket Mood: Schizophrenic\nTrading Volume: Elevated\nVolatility Index: Spicy 🌶️"
    }

    // Clear command
    if (cmd === "clear") {
      return "Terminal cleared. Type 'help' for available commands."
    }

    // Easter eggs
    if (cmd === "stonks") {
      return "📈 STONKS ONLY GO UP (except when they don't)"
    }

    if (cmd === "guh") {
      return "The sound your portfolio makes when you discover options trading"
    }

    if (cmd === "printer") {
      return "Money printer status: BRRRRRRRRR 💵💵💵"
    }

    if (cmd === "moon") {
      return "🚀🌕 T-minus 10... 9... 8... Ignition sequence start"
    }

    if (cmd === "lambo") {
      return "Lambo ETA: Soon™ (requires portfolio value increase of approximately 69,420%)"
    }

    // Unknown command
    return `Command not recognized: '${command}'. Type 'help' for available commands.`
  }

  return <CommandContext.Provider value={{ executeCommand }}>{children}</CommandContext.Provider>
}

export function useCommand() {
  const context = useContext(CommandContext)
  if (context === undefined) {
    throw new Error("useCommand must be used within a CommandProvider")
  }
  return context
}
