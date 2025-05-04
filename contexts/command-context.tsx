// Command context file for managing commands and their execution

// Import necessary dependencies
import { createContext, useContext, useState, type ReactNode } from "react"
import { usePortfolio } from "@/contexts/portfolio-context"
import { toast } from "@/hooks/use-toast"

// Define the structure of a command result
/**
 * CommandResult represents the outcome of a command execution.
 * It contains a success flag, a message, and optional data.
 */
type CommandResult = {
  success: boolean
  message: string
  data?: any
}

// Define the structure of a command handler function
/**
 * CommandHandler is a function that takes an array of arguments and returns a CommandResult.
 */
type CommandHandler = (args: string[]) => CommandResult

// Define the structure of a command definition
/**
 * CommandDefinition represents a command with its name, description, usage, examples, and handler.
 */
type CommandDefinition = {
  name: string
  description: string
  usage: string
  examples: string[]
  handler: CommandHandler
  aliases?: string[]
}

// Define the structure of the command context
/**
 * CommandContextType represents the shape of the command context.
 * It contains functions for executing commands, managing command history, and accessing commands.
 */
type CommandContextType = {
  executeCommand: (command: string) => string
  commandHistory: string[]
  addToHistory: (command: string) => void
  clearHistory: () => void
  commands: Record<string, CommandDefinition>
}

// Create the command context
const CommandContext = createContext<CommandContextType | undefined>(undefined)

// Command provider component
/**
 * CommandProvider is a React component that provides the command context to its children.
 * It manages the command history and provides functions for executing commands.
 */
export function CommandProvider({ children }: { children: ReactNode }) {
  // State for command history
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  
  // Access portfolio context
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
  /**
   * addToHistory adds a command to the beginning of the command history.
   * It limits the history to 50 commands.
   */
  const addToHistory = (command: string) => {
    setCommandHistory(prev => [command, ...prev.slice(0, 49)])
  }
  
  // Clear command history
  /**
   * clearHistory clears the command history.
   */
  const clearHistory = () => {
    setCommandHistory([])
  }
  
  // Show command handler
  /**
   * showCommand handles the 'show' command.
   * It displays market data or portfolio information based on the provided arguments.
   */
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
  /**
   * portfolioCommand handles the 'portfolio' command.
   * It displays the user's portfolio holdings and performance.
   */
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
  /**
   * buyCommand handles the 'buy' command.
   * It purchases shares of a stock based on the provided symbol and amount.
   */
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
  /**
   * sellCommand handles the 'sell' command.
   * It sells shares of a stock from the user's portfolio based on the provided symbol and amount.
   */
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
  /**
   * watchlistCommand handles the 'watchlist' command.
   * It allows users to add or remove stocks from their watchlist.
   */
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
    
    if (args[0].toLowerCase() === "add") {
      if (args.length < 2) {
        return {
          success: false,
          message: "Invalid format. Use 'watchlist add [symbol]'"
        }
      }
      
      const symbol = args[1].toUpperCase()
      
      if (portfolio.watchlist.find((w) => w.symbol === symbol)) {
        return {
          success: false,
          message: `You already have ${symbol} in your watchlist`
        }
      }
      
      const result = addToWatchlist(symbol)
      
      if (result.success) {
        return {
          success: true,
          message: `Added ${symbol} to your watchlist`
        }
      } else {
        return {
          success: false,
          message: `Failed to add ${symbol} to your watchlist: ${result.error}`
        }
      }
    }
    
    if (args[0].toLowerCase() === "remove") {
      if (args.length < 2) {
        return {
          success: false,
          message: "Invalid format. Use 'watchlist remove [symbol]'"
        }
      }
      
      const symbol = args[1].toUpperCase()
      
      if (!portfolio.watchlist.find((w) => w.symbol === symbol)) {
        return {
          success: false,
          message: `You don't have ${symbol} in your watchlist`
        }
      }
      
      const result = removeFromWatchlist(symbol)
      
      if (result.success) {
        return {
          success: true,
          message: `Removed ${symbol} from your watchlist`
        }
      } else {
        return {
          success: false,
          message: `Failed to remove ${symbol} from your watchlist: ${result.error}`
        }
      }
    }
    
    return {
      success: false,
      message: "Invalid watchlist command. Use 'watchlist add [symbol]' or 'watchlist remove [symbol]'"
    }
  }
  
  // Alert command handler
  /**
   * alertCommand handles the 'alert' command.
   * It allows users to set or remove price alerts for stocks.
   * TODO: Implement more robust alert management (e.g., persistence, notifications).
   */
  const alertCommand = (args: string[]): CommandResult => {
    if (args.length === 0) {
      if (portfolio.alerts.length === 0) {
        return {
          success: false,
          message: "You have no active alerts. Use 'alert set [symbol] [price]' to set an alert."
        }
      }
      
      return {
        success: true,
        message: `Your Alerts:\n${portfolio.alerts.map((a) => `${a.symbol}: $${a.price}`).join("\n")}\n`
      }
    }
    
    if (args[0].toLowerCase() === "set") {
      if (args.length < 3) {
        return {
          success: false,
          message: "Invalid format. Use 'alert set [symbol] [price]'"
        }
      }
      
      const symbol = args[1].toUpperCase()
      const price = Number.parseFloat(args[2])
      
      if (isNaN(price) || price <= 0) {
        return {
          success: false,
          message: "Invalid price. Please enter a positive number."
        }
      }
      
      const result = addAlert(symbol, price)
      
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
    
    if (args[0].toLowerCase() === "remove") {
      if (args.length < 2) {
        return {
          success: false,
          message: "Invalid format. Use 'alert remove [symbol]'"
        }
      }
      
      const symbol = args[1].toUpperCase()
      
      if (!portfolio.alerts.find((a) => a.symbol === symbol)) {
        return {
          success: false,
          message: `You don't have an alert set for ${symbol}`
        }
      }
      
      const result = removeAlert(symbol)
      
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
  /**
   * compareCommand handles the 'compare' command.
   * It compares the performance of two stocks.
   * TODO: Implement actual data fetching and comparison logic.
   * NOTE: There are several linting errors related to argument counts in the command handlers. These should be addressed in a future pass.
   */
  const compareCommand = (args: string[]): CommandResult => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Invalid format. Use 'compare [symbol1] [symbol2]'"
      }
    }
    
    const symbol1 = args[0].toUpperCase()
    const symbol2 = args[1].toUpperCase()
    
    // Mock comparison logic
    return {
      success: true,
      message: `Comparing ${symbol1} and ${symbol2}...`
    }
  }
  
  // ... (rest of the code remains the same)
