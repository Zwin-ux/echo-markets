"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { usePortfolio } from "@/contexts/portfolio-context"
import { toast } from "@/hooks/use-toast"

type CommandResult = {
  success: boolean
  message: string
  data?: any
}

type CommandHandler = (args: string[]) => CommandResult

type CommandDefinition = {
  name: string
  description: string
  usage: string
  examples: string[]
  handler: CommandHandler
  aliases?: string[]
}

type CommandContextType = {
  executeCommand: (command: string) => string
  commandHistory: string[]
  addToHistory: (command: string) => void
  clearHistory: () => void
  commands: Record<string, CommandDefinition>
}

const CommandContext = createContext<CommandContextType | undefined>(undefined)

export function CommandProvider({ children }: { children: ReactNode }) {
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const { 
    portfolio, 
    addToPortfolio, 
    removeFromPortfolio, 
    addToWatchlist, 
    removeFromWatchlist, 
    addAlert, 
    removeAlert 
  } = usePortfolio()
  
  // Add command to history
  const addToHistory = (command: string) => {
    setCommandHistory(prev => [command, ...prev.slice(0, 49)])
  }
  
  // Clear command history
  const clearHistory = () => {
    setCommandHistory([])
  }
  
  // Show command handler
  const showCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Please specify what to show. Try 'show sp500', 'show nasdaq', or 'show portfolio'"
      }
    }
    
    const index = args[0].toLowerCase()
    
    if (index === "sp500" || index === "s&p500" || index === "s&p") {
      return {
        success: true,
        message: "S&P 500: 4,327.12 (-1.2%) | YTD: +12.4% | P/E: 21.3 | Volatility: High"
      }
    }
    
    if (index === "nasdaq" || index === "ndx") {
      return {
        success: true,
        message: "NASDAQ: 14,723.45 (+0.8%) | YTD: +18.7% | Tech-heavy index mooning frfr"
      }
    }
    
    if (index === "btc" || index === "bitcoin") {
      return {
        success: true,
        message: "Bitcoin: $43,215.67 (+3.4%) | 24h Vol: $28.5B | No cap, still volatile | Social Sentiment: Bullish"
      }
    }
    
    if (index === "fed" || index === "rates") {
      return {
        success: true,
        message: "Fed Funds Rate: 5.25-5.50% | Next meeting: In 15 days | Market pricing in 0% chance of hike | Yield Curve: Inverted"
      }
    }
    
    if (index === "portfolio") {
      if (portfolio.holdings.length === 0) {
        return {
          success: false,
          message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
        }
      }
      
      return {
        success: true,
        message: `Your Portfolio:\n${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}\nTotal Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\n`
      }
    }
    
    if (index === "watchlist") {
      if (portfolio.watchlist.length === 0) {
        return {
          success: false,
          message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks."
        }
      }
      
      return {
        success: true,
        message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price} (${w.change > 0 ? "+" : ""}${w.change}%)`).join("\n")}\n`
      }
    }
    
    return {
      success: false,
      message: `Unknown index: ${index}. Try 'show sp500' or 'show nasdaq'`
    }
  }
  
  // Portfolio command handler
  const portfolioCommand = (args: string[]): CommandResult => {
    if (portfolio.holdings.length === 0) {
      return {
        success: false,
        message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
      }
    }
    
    return {
      success: true,
      message: `Your Portfolio:\n${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}\nTotal Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\n`
    }
  }
  
  // Buy command handler
  const buyCommand = (args: string[]): CommandResult => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Invalid format. Use 'buy [symbol] [amount]'"
      }
    }
    
    const symbol = args[0].toUpperCase()
    const amount = Number.parseInt(args[1])
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "Invalid amount. Please enter a positive number."
      }
    }
    
    // Mock price generation
    const price = Math.floor(Math.random() * 500) + 50
    const totalCost = price * amount
    
    if (totalCost > portfolio.cash) {
      return {
        success: false,
        message: `Insufficient funds. You need $${totalCost.toFixed(2)} but have $${portfolio.cash.toFixed(2)}`
      }
    }
    
    const result = addToPortfolio(symbol, amount, price)
    
    if (result.success) {
      return {
        success: true,
        message: `Bought ${amount} shares of ${symbol} at $${price} for a total of $${totalCost.toFixed(2)}`
      }
    } else {
      return {
        success: false,
        message: `Failed to buy ${symbol}: ${result.error}`
      }
    }
  }
  
  // Sell command handler
  const sellCommand = (args: string[]): CommandResult => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Invalid format. Use 'sell [symbol] [amount]'"
      }
    }
    
    const symbol = args[0].toUpperCase()
    const amount = Number.parseInt(args[1])
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "Invalid amount. Please enter a positive number."
      }
    }
    
    const holding = portfolio.holdings.find((h) => h.symbol === symbol)
    
    if (!holding) {
      return {
        success: false,
        message: `You don't own any shares of ${symbol}`
      }
    }
    
    if (holding.shares < amount) {
      return {
        success: false,
        message: `You only have ${holding.shares} shares of ${symbol}`
      }
    }
    
    const result = removeFromPortfolio(symbol, amount, holding.currentPrice)
    
    if (result.success) {
      return {
        success: true,
        message: `Sold ${amount} shares of ${symbol} at $${holding.currentPrice} for a total of $${(holding.currentPrice * amount).toFixed(2)}`
      }
    } else {
      return {
        success: false,
        message: `Failed to sell ${symbol}: ${result.error}`
      }
    }
  }
  
  // Watchlist command handler
  const watchlistCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      if (portfolio.watchlist.length === 0) {
        return {
          success: false,
          message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks."
        }
      }
      
      return {
        success: true,
        message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price} (${w.change > 0 ? "+" : ""}${w.change}%)`).join("\n")}\n`
      }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === "add" && args.length > 1) {
      const symbol = args[1].toUpperCase()
      // Generate mock price and change for the watchlist item
      const price = Math.floor(Math.random() * 500) + 50
      const change = (Math.random() * 10 - 5).toFixed(2)
      const result = addToWatchlist(symbol, price, Number(change))
      
      if (result.success) {
        return {
          success: true,
          message: `Added ${symbol} to your watchlist`
        }
      } else {
        return {
          success: false,
          message: `Failed to add ${symbol} to watchlist: ${result.error}`
        }
      }
    }
    
    if (action === "remove" && args.length > 1) {
      const symbol = args[1].toUpperCase()
      // The removeFromWatchlist function only takes one argument
      const result = removeFromWatchlist(symbol)
      
      if (result.success) {
        return {
          success: true,
          message: `Removed ${symbol} from your watchlist`
        }
      } else {
        return {
          success: false,
          message: `Failed to remove ${symbol} from watchlist: ${result.error}`
        }
      }
    }
    
    return {
      success: false,
      message: "Invalid watchlist command. Use 'watchlist add [symbol]' or 'watchlist remove [symbol]'"
    }
  }
  
  // Alert command handler
  const alertCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      if (portfolio.alerts.length === 0) {
        return {
          success: false,
          message: "You have no alerts set. Use 'alert set [symbol] [price]' to set an alert."
        }
      }
      
      return {
        success: true,
        message: `Your Alerts:\n${portfolio.alerts.map((a) => `${a.symbol}: Alert at $${a.targetPrice} (${a.direction === "above" ? "Trigger when above" : "Trigger when below"})`).join("\n")}\n`
      }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === "set" && args.length > 2) {
      const symbol = args[1].toUpperCase()
      const price = Number.parseFloat(args[2])
      
      if (isNaN(price) || price <= 0) {
        return {
          success: false,
          message: "Invalid price. Please enter a positive number."
        }
      }
      
      // Mock current price for the alert
      const currentPrice = Math.floor(Math.random() * 500) + 50
      // Determine if this is an above or below alert (randomly)
      const direction = Math.random() > 0.5 ? "above" : "below"
      const result = addAlert(symbol, price, direction)
      
      if (result.success) {
        return {
          success: true,
          message: `Set alert for ${symbol} at $${price}`
        }
      } else {
        return {
          success: false,
          message: `Failed to set alert for ${symbol}: ${result.error}`
        }
      }
    }
    
    if (action === "remove" && args.length > 1) {
      const symbol = args[1].toUpperCase()
      // The removeAlert function expects a number as the second argument
      const result = removeAlert(symbol, 1) // Using 1 as a reason code for manual removal
      
      if (result.success) {
        return {
          success: true,
          message: `Removed alert for ${symbol}`
        }
      } else {
        return {
          success: false,
          message: `Failed to remove alert for ${symbol}: ${result.error}`
        }
      }
    }
    
    return {
      success: false,
      message: "Invalid alert command. Use 'alert set [symbol] [price]' or 'alert remove [symbol]'"
    }
  }
  
  // Compare command handler
  const compareCommand = (args: string[]): CommandResult => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Invalid format. Use 'compare [symbol1] [symbol2]'"
      }
    }
    
    const symbol1 = args[0].toUpperCase()
    const symbol2 = args[1].toUpperCase()
    
    // Mock comparison data
    return {
      success: true,
      message: `Comparison: ${symbol1} vs ${symbol2}\n\nPrice: $342.50 vs $178.25\nP/E Ratio: 28.5 vs 15.2\nMarket Cap: $2.1T vs $850B\nYTD: +15.2% vs +8.7%\n52w High: $380.12 vs $210.45\n52w Low: $290.33 vs $145.78\nVolume: 32.5M vs 18.2M\n\nAnalyst Take: ${symbol1} has stronger growth metrics but ${symbol2} may be more undervalued.`
    }
  }
  
  // Explain command handler
  const explainCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Please specify a term to explain. Try 'explain P/E ratio' or 'explain market cap'"
      }
    }
    
    const term = args.join(" ").toLowerCase()
    
    const explanations: Record<string, string> = {
      "p/e ratio": "Price-to-Earnings (P/E) Ratio: A valuation ratio calculated by dividing a company's current share price by its earnings per share (EPS). A high P/E could mean the stock is overvalued or investors expect high growth rates. A low P/E might indicate undervaluation or expected decline.",
      "market cap": "Market Capitalization: The total value of a company's outstanding shares, calculated by multiplying the share price by the number of shares. It represents the company's total market value. Companies are often categorized as large-cap (>$10B), mid-cap ($2-10B), or small-cap ($300M-2B).",
      "dividend": "Dividend: A portion of a company's earnings paid to shareholders, usually in cash. Dividends provide income to investors and signal company financial health. The dividend yield is the annual dividend amount divided by the share price, expressed as a percentage.",
      "bull market": "Bull Market: A financial market condition where prices are rising or expected to rise. Characterized by optimism, investor confidence, and expectations of strong results. Typically lasts months or years.",
      "bear market": "Bear Market: A financial market condition where prices are falling or expected to fall. Characterized by pessimism, fear, and negative sentiment. Typically defined as a 20% or more decline from recent highs.",
      "volatility": "Volatility: A statistical measure of the dispersion of returns for a given security or market index. Higher volatility means the price can change dramatically over a short time period. Lower volatility means more stable, predictable price movements.",
      "etf": "Exchange-Traded Fund (ETF): A type of investment fund traded on stock exchanges. ETFs hold assets like stocks, bonds, or commodities and generally operate with an arbitrage mechanism to keep trading close to net asset value. They offer diversification, low expense ratios, and tax efficiency.",
      "short selling": "Short Selling: An investment strategy where an investor borrows shares and immediately sells them, hoping to buy them back later at a lower price, return them to the lender, and profit from the difference. It's a bet that the stock price will decline.",
      "options": "Options: Financial derivatives that give buyers the right, but not the obligation, to buy (call) or sell (put) an underlying asset at a predetermined price (strike price) before a specified date (expiration). They're used for hedging, income generation, or speculation."
    }
    
    // Find the closest match
    const match = Object.keys(explanations).find(key => term.includes(key) || key.includes(term))
    
    if (match) {
      return {
        success: true,
        message: explanations[match]
      }
    }
    
    return {
      success: false,
      message: `Sorry, I don't have an explanation for '${term}'. Try another term like 'p/e ratio' or 'market cap'.`
    }
  }
  
  // News command handler
  const newsCommand = (args: string[]): CommandResult => {
    const symbol = args.length > 0 ? args[0].toUpperCase() : "market"
    
    // Mock news data
    const marketNews = [
      "Fed signals potential rate cuts later this year as inflation cools",
      "S&P 500 reaches new all-time high amid strong earnings season",
      "Treasury yields fall as investors flock to safe-haven assets",
      "Oil prices surge after OPEC+ announces production cuts",
      "Tech stocks lead market rally as AI investments continue to grow"
    ]
    
    const stockNews: Record<string, string[]> = {
      "AAPL": [
        "Apple unveils new iPhone 15 with revolutionary AI capabilities",
        "Apple's services revenue grows 20% year-over-year, beating expectations",
        "Apple announces $100B stock buyback program, raises dividend",
        "Apple's AR headset launch delayed until Q1 next year, sources say",
        "Apple opens new campus in Austin, creating 5,000 jobs"
      ],
      "MSFT": [
        "Microsoft Cloud revenue surpasses $100B annual run rate",
        "Microsoft's AI investments paying off as Copilot adoption accelerates",
        "Microsoft announces new Xbox console for holiday 2025",
        "Microsoft acquires cybersecurity firm for $8.5B",
        "Microsoft Teams reaches 300M daily active users, surpassing Slack"
      ],
      "TSLA": [
        "Tesla delivers record 450,000 vehicles in Q2, beating estimates",
        "Tesla's Full Self-Driving software now available in Europe",
        "Tesla breaks ground on new Gigafactory in Mexico",
        "Tesla's energy business grows 75% YoY as Powerwall demand surges",
        "Tesla cuts prices on Model Y and Model 3 in competitive push"
      ]
    }
    
    if (symbol === "MARKET" || symbol === "MARKETS") {
      return {
        success: true,
        message: `Latest Market News:\n\n${marketNews.map(news => `• ${news}`).join("\n")}`
      }
    }
    
    if (stockNews[symbol]) {
      return {
        success: true,
        message: `Latest News for ${symbol}:\n\n${stockNews[symbol].map(news => `• ${news}`).join("\n")}`
      }
    }
    
    // Generic news for symbols without specific news
    return {
      success: true,
      message: `Latest News for ${symbol}:\n\n• ${symbol} reports quarterly earnings above analyst expectations\n• ${symbol} announces new product line, stock jumps 3%\n• Analysts raise price target on ${symbol} citing strong growth\n• ${symbol} expands into international markets\n• Institutional investors increase positions in ${symbol}`
    }
  }
  
  // Social command handler
  const socialCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Please specify a symbol. Try 'social AAPL' or 'social TSLA'"
      }
    }
    
    const symbol = args[0].toUpperCase()
    
    // Mock social sentiment data
    const sentiments: Record<string, { sentiment: string, bullish: number, bearish: number, neutral: number, trending: boolean, comments: string[] }> = {
      "AAPL": {
        sentiment: "Bullish",
        bullish: 68,
        bearish: 12,
        neutral: 20,
        trending: true,
        comments: [
          "AAPL crushing it with services revenue 🚀",
          "iPhone 15 will be the biggest upgrade cycle yet",
          "Bought more AAPL on the dip, easy money",
          "Their cash position is insane, buybacks incoming",
          "Apple Car is going to disrupt the entire industry"
        ]
      },
      "TSLA": {
        sentiment: "Mixed",
        bullish: 52,
        bearish: 38,
        neutral: 10,
        trending: true,
        comments: [
          "TSLA to $1000 EOY, mark my words 🚀🚀🚀",
          "Robotaxis will never happen, all hype",
          "Elon sold again? Bearish",
          "FSD is years ahead of competition",
          "Production numbers looking good this quarter"
        ]
      },
      "GME": {
        sentiment: "Meme-ish",
        bullish: 75,
        bearish: 20,
        neutral: 5,
        trending: false,
        comments: [
          "GME MOASS tomorrow 🦍💎🙌",
          "Ryan Cohen playing 5D chess",
          "Shorts never covered",
          "DRS is the way",
          "Fundamentals don't matter, it's all about the squeeze"
        ]
      }
    }
    
    // Default sentiment for symbols without specific data
    const defaultSentiment = {
      sentiment: ["Bullish", "Bearish", "Neutral", "Mixed"][Math.floor(Math.random() * 4)],
      bullish: Math.floor(Math.random() * 60) + 20,
      bearish: Math.floor(Math.random() * 40) + 10,
      neutral: Math.floor(Math.random() * 30) + 10,
      trending: Math.random() > 0.7,
      comments: [
        `${symbol} looking good for a swing trade`,
        `Bought ${symbol} today, technical breakout imminent`,
        `${symbol} earnings will disappoint, mark my words`,
        `${symbol} is undervalued compared to peers`,
        `Anyone else watching ${symbol}? Chart looks bullish`
      ]
    }
    
    const data = sentiments[symbol] || defaultSentiment
    
    return {
      success: true,
      message: `Social Sentiment for ${symbol}:\n\nOverall: ${data.sentiment}\nBullish: ${data.bullish}%\nBearish: ${data.bearish}%\nNeutral: ${data.neutral}%\n${data.trending ? "🔥 Trending on social media" : ""}\n\nRecent Comments:\n${data.comments.map(comment => `• "${comment}"`).join("\n")}`
    }
  }
  
  // Meme command handler
  const memeCommand = (args: string[]): CommandResult => {
    // Mock meme data
    const memes = [
      "JPow with the money printer going brrrrr",
      "Stonks guy when your portfolio is up 0.02%",
      "\"Buy the dip\" vs \"The dip\" vs \"The actual dip\"",
      "Wall Street Bets trader explaining to wife why they're eating ramen for the 7th day in a row",
      "When you finally break even after 8 months of trading",
      "Bears every time the market drops 0.1%",
      "Bulls explaining why this time is different",
      "Hedge funds vs Reddit traders",
      "My technical analysis vs The market",
      "Diamond hands vs Paper hands"
    ]
    
    const randomIndex = Math.floor(Math.random() * memes.length)
    
    return {
      success: true,
      message: `Random Stock Market Meme:\n\n"${memes[randomIndex]}"\n\n[Imagine a hilarious stock market meme here]`
    }
  }
  
  // Drama command handler
  const dramaCommand = (args: string[]): CommandResult => {
    // Mock drama data
    const dramas = [
      "Activist investor launches proxy fight against tech giant's board, demanding higher dividends and less R&D spending",
      "Famous hedge fund manager caught in accounting scandal, SEC investigating",
      "CEO resigns after controversial tweets tank company stock by 15%",
      "Startup unicorn accused of inflating user metrics ahead of IPO",
      "Short seller report alleges fraud at biotech company, stock plummets 30%",
      "Rival CEOs engage in Twitter war over market share claims",
      "Meme stock community accuses hedge funds of market manipulation",
      "Whistleblower reveals internal documents showing company knew about product defects",
      "Crypto exchange freezes withdrawals amid liquidity concerns",
      "Central bank president's offhand comment sends markets into tailspin"
    ]
    
    const randomIndex = Math.floor(Math.random() * dramas.length)
    
    return {
      success: true,
      message: `Latest Market Drama:\n\n${dramas[randomIndex]}`
    }
  }
  
  // History command handler
  const historyCommand = (args: string[]): CommandResult => {
    if (commandHistory.length === 0) {
      return {
        success: false,
        message: "Command history is empty."
      }
    }
    
    return {
      success: true,
      message: `Command History:\n\n${commandHistory.map((cmd, index) => `${index + 1}. ${cmd}`).join("\n")}`
    }
  }
  
  // Clear command handler
  const clearCommand = (args: string[]): CommandResult => {
    clearHistory()
    return {
      success: true,
      message: "Terminal cleared."
    }
  }
  
  // Help command handler
  const helpCommand = (args: string[]): CommandResult => {
    // Define commands object to avoid reference error
    const commands: Record<string, CommandDefinition> = {
      help: {
        name: "help",
        description: "Shows help information for available commands",
        usage: "help [command]",
        examples: ["help", "help show", "help buy"],
        handler: helpCommand
      },
      show: {
        name: "show",
        description: "Display market data or portfolio information",
        usage: "show [what]",
        examples: ["show sp500", "show nasdaq", "show portfolio", "show watchlist"],
        handler: showCommand
      },
      portfolio: {
        name: "portfolio",
        description: "View your portfolio holdings and performance",
        usage: "portfolio",
        examples: ["portfolio"],
        handler: portfolioCommand
      },
      buy: {
        name: "buy",
        description: "Purchase shares of a stock",
        usage: "buy [symbol] [amount]",
        examples: ["buy AAPL 10", "buy MSFT 5"],
        handler: buyCommand
      },
      sell: {
        name: "sell",
        description: "Sell shares of a stock from your portfolio",
        usage: "sell [symbol] [amount]",
        examples: ["sell AAPL 5", "sell MSFT 2"],
        handler: sellCommand
      },
      watchlist: {
        name: "watchlist",
        description: "Manage your watchlist of stocks",
        usage: "watchlist [add/remove] [symbol]",
        examples: ["watchlist add AAPL", "watchlist remove MSFT", "watchlist"],
        handler: watchlistCommand
      },
      alert: {
        name: "alert",
        description: "Set price alerts for stocks",
        usage: "alert [set/remove] [symbol] [price]",
        examples: ["alert set AAPL 150", "alert remove MSFT", "alert"],
        handler: alertCommand
      },
      compare: {
        name: "compare",
        description: "Compare performance between stocks",
        usage: "compare [symbol1] [symbol2]",
        examples: ["compare AAPL MSFT", "compare TSLA RIVN"],
        handler: compareCommand
      },
      explain: {
        name: "explain",
        description: "Get explanations of financial terms and concepts",
        usage: "explain [term]",
        examples: ["explain P/E ratio", "explain market cap", "explain dividend"],
        handler: explainCommand
      },
      news: {
        name: "news",
        description: "Get latest news for a stock or the market",
        usage: "news [symbol/market]",
        examples: ["news AAPL", "news market", "news crypto"],
        handler: newsCommand
      },
      social: {
        name: "social",
        description: "View social media sentiment for a stock",
        usage: "social [symbol]",
        examples: ["social AAPL", "social TSLA"],
        handler: socialCommand
      },
      meme: {
        name: "meme",
        description: "Get a random stock market meme",
        usage: "meme",
        examples: ["meme"],
        handler: memeCommand
      },
      drama: {
        name: "drama",
        description: "Get the latest market drama",
        usage: "drama",
        examples: ["drama"],
        handler: dramaCommand
      },
      history: {
        name: "history",
        description: "View your command history",
        usage: "history",
        examples: ["history"],
        handler: historyCommand
      },
      clear: {
        name: "clear",
        description: "Clear the terminal",
        usage: "clear",
        examples: ["clear"],
        handler: clearCommand
      }
    }
    
    // If specific command help is requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase()
      const command = commands[commandName] || Object.values(commands).find(cmd => 
        cmd.aliases?.includes(commandName)
      )
      
      if (command) {
        return {
          success: true,
          message: `Command: ${command.name}\n${command.description}\n\nUsage: ${command.usage}\nExamples:\n${command.examples.map((ex: string) => `- ${ex}`).join('\n')}`
        }
      } else {
        return {
          success: false,
          message: `No help available for '${args[0]}'. Type 'help' to see all available commands.`
        }
      }
    }
    
    // General help
    const categories = {
      'Market Data': ['show', 'compare'],
      'Education': ['explain'],
      'Portfolio Management': ['portfolio', 'buy', 'sell'],
      'Watchlist': ['watchlist'],
      'Alerts': ['alert'],
      'News & Social': ['news', 'social'],
      'Fun': ['meme', 'drama'],
      'System': ['help', 'clear', 'history']
    }
    
    let helpMessage = "Available Commands:\n\n"
    
    for (const [category, commandList] of Object.entries(categories)) {
      helpMessage += `${category}:\n`
      commandList.forEach(cmd => {
        helpMessage += `- ${cmd}: ${commands[cmd].description}\n`
      })
      helpMessage += "\n"
    }
    
    helpMessage += "Type 'help [command]' for more information about a specific command."
    
    return {
      success: true,
      message: helpMessage
    }
  }
  
  // Execute command function
  const executeCommand = (commandStr: string): string => {
    if (!commandStr.trim()) {
      return "Type a command or 'help' to see available commands."
    }
    
    // Add command to history
    addToHistory(commandStr)
    
    // Parse command and arguments
    const parts = commandStr.trim().split(/\s+/)
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1)
    
    // Easter eggs
    if (commandName === "yolo") {
      return "YOLO! 💎🙌 Buying 100 GME with your life savings!"
    }
    
    if (commandName === "moon") {
      return "🚀🚀🚀 TO THE MOON! 🚀🚀🚀"
    }
    
    if (commandName === "wen" && args[0]?.toLowerCase() === "lambo") {
      return "Soon, fellow ape. Soon. 🦍"
    }
    
    // Define commands object to avoid reference error
    const commands: Record<string, CommandDefinition> = {
      help: {
        name: "help",
        description: "Shows help information for available commands",
        usage: "help [command]",
        examples: ["help", "help show", "help buy"],
        handler: helpCommand
      },
      show: {
        name: "show",
        description: "Display market data or portfolio information",
        usage: "show [what]",
        examples: ["show sp500", "show nasdaq", "show portfolio", "show watchlist"],
        handler: showCommand
      },
      portfolio: {
        name: "portfolio",
        description: "View your portfolio holdings and performance",
        usage: "portfolio",
        examples: ["portfolio"],
        handler: portfolioCommand
      },
      buy: {
        name: "buy",
        description: "Purchase shares of a stock",
        usage: "buy [symbol] [amount]",
        examples: ["buy AAPL 10", "buy MSFT 5"],
        handler: buyCommand
      },
      sell: {
        name: "sell",
        description: "Sell shares of a stock from your portfolio",
        usage: "sell [symbol] [amount]",
        examples: ["sell AAPL 5", "sell MSFT 2"],
        handler: sellCommand
      },
      watchlist: {
        name: "watchlist",
        description: "Manage your watchlist of stocks",
        usage: "watchlist [add/remove] [symbol]",
        examples: ["watchlist add AAPL", "watchlist remove MSFT", "watchlist"],
        handler: watchlistCommand
      },
      alert: {
        name: "alert",
        description: "Set price alerts for stocks",
        usage: "alert [set/remove] [symbol] [price]",
        examples: ["alert set AAPL 150", "alert remove MSFT", "alert"],
        handler: alertCommand
      },
      compare: {
        name: "compare",
        description: "Compare performance between stocks",
        usage: "compare [symbol1] [symbol2]",
        examples: ["compare AAPL MSFT", "compare TSLA RIVN"],
        handler: compareCommand
      },
      explain: {
        name: "explain",
        description: "Get explanations of financial terms and concepts",
        usage: "explain [term]",
        examples: ["explain P/E ratio", "explain market cap", "explain dividend"],
        handler: explainCommand
      },
      news: {
        name: "news",
        description: "Get latest news for a stock or the market",
        usage: "news [symbol/market]",
        examples: ["news AAPL", "news market", "news crypto"],
        handler: newsCommand
      },
      social: {
        name: "social",
        description: "View social media sentiment for a stock",
        usage: "social [symbol]",
        examples: ["social AAPL", "social TSLA"],
        handler: socialCommand
      },
      meme: {
        name: "meme",
        description: "Get a random stock market meme",
        usage: "meme",
        examples: ["meme"],
        handler: memeCommand
      },
      drama: {
        name: "drama",
        description: "Get the latest market drama",
        usage: "drama",
        examples: ["drama"],
        handler: dramaCommand
      },
      history: {
        name: "history",
        description: "View your command history",
        usage: "history",
        examples: ["history"],
        handler: historyCommand
      },
      clear: {
        name: "clear",
        description: "Clear the terminal",
        usage: "clear",
        examples: ["clear"],
        handler: clearCommand
      }
    }
    
    // Find command by name or alias
    const command = commands[commandName] || Object.values(commands).find(cmd => 
      cmd.aliases?.includes(commandName)
    )
    
    if (!command) {
      return `Unknown command: '${commandName}'. Type 'help' to see available commands.`
    }
    
    // Execute command handler
    const result = command.handler(args)
    return result.message
  }
  
  // Define commands object for the context
  const commands: Record<string, CommandDefinition> = {
    help: {
      name: "help",
      description: "Shows help information for available commands",
      usage: "help [command]",
      examples: ["help", "help show", "help buy"],
      handler: helpCommand
    },
    show: {
      name: "show",
      description: "Display market data or portfolio information",
      usage: "show [what]",
      examples: ["show sp500", "show nasdaq", "show portfolio", "show watchlist"],
      handler: showCommand
    },
    portfolio: {
      name: "portfolio",
      description: "View your portfolio holdings and performance",
      usage: "portfolio",
      examples: ["portfolio"],
      handler: portfolioCommand
    },
    buy: {
      name: "buy",
      description: "Purchase shares of a stock",
      usage: "buy [symbol] [amount]",
      examples: ["buy AAPL 10", "buy MSFT 5"],
      handler: buyCommand
    },
    sell: {
      name: "sell",
      description: "Sell shares of a stock from your portfolio",
      usage: "sell [symbol] [amount]",
      examples: ["sell AAPL 5", "sell MSFT 2"],
      handler: sellCommand
    },
    watchlist: {
      name: "watchlist",
      description: "Manage your watchlist of stocks",
      usage: "watchlist [add/remove] [symbol]",
      examples: ["watchlist add AAPL", "watchlist remove MSFT", "watchlist"],
      handler: watchlistCommand
    },
    alert: {
      name: "alert",
      description: "Set price alerts for stocks",
      usage: "alert [set/remove] [symbol] [price]",
      examples: ["alert set AAPL 150", "alert remove MSFT", "alert"],
      handler: alertCommand
    },
    compare: {
      name: "compare",
      description: "Compare performance between stocks",
      usage: "compare [symbol1] [symbol2]",
      examples: ["compare AAPL MSFT", "compare TSLA RIVN"],
      handler: compareCommand
    },
    explain: {
      name: "explain",
      description: "Get explanations of financial terms and concepts",
      usage: "explain [term]",
      examples: ["explain P/E ratio", "explain market cap", "explain dividend"],
      handler: explainCommand
    },
    news: {
      name: "news",
      description: "Get latest news for a stock or the market",
      usage: "news [symbol/market]",
      examples: ["news AAPL", "news market", "news crypto"],
      handler: newsCommand
    },
    social: {
      name: "social",
      description: "View social media sentiment for a stock",
      usage: "social [symbol]",
      examples: ["social AAPL", "social TSLA"],
      handler: socialCommand
    },
    meme: {
      name: "meme",
      description: "Get a random stock market meme",
      usage: "meme",
      examples: ["meme"],
      handler: memeCommand
    },
    drama: {
      name: "drama",
      description: "Get the latest market drama",
      usage: "drama",
      examples: ["drama"],
      handler: dramaCommand
    },
    history: {
      name: "history",
      description: "View your command history",
      usage: "history",
      examples: ["history"],
      handler: historyCommand
    },
    clear: {
      name: "clear",
      description: "Clear the terminal",
      usage: "clear",
      examples: ["clear"],
      handler: clearCommand
    }
  }
  
  return (
    <CommandContext.Provider
      value={{
        executeCommand,
        commandHistory,
        addToHistory,
        clearHistory,
        commands
      }}
    >
      {children}
    </CommandContext.Provider>
  )
}

export function useCommand() {
  const context = useContext(CommandContext)
  
  if (!context) {
    throw new Error("useCommand must be used within a CommandProvider")
  }
  
  return context
}
