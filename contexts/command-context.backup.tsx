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
      const result = addToWatchlist(symbol)
      
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
  
  // Define command handlers
  const helpCommand = (args: string[]): CommandResult => {
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
      'Fun': ['meme', 'drama', 'stonks'],
      'System': ['help', 'clear', 'history']
    }
    
    let helpText = 'Available Commands:\n'
    
    for (const [category, commandNames] of Object.entries(categories)) {
      helpText += `\n${category}:\n`
      for (const name of commandNames) {
        const command = commands[name]
        if (command) {
          helpText += `- ${command.name}: ${command.description.split('\n')[0]}\n`
        }
      }
    }
    
    helpText += '\nFor detailed help on a specific command, type: help [command]'
    
    return {
      success: true,
      message: helpText
    }
  }
  
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

export function CommandProvider({ children }: { children: ReactNode }) {
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const { portfolio, addToPortfolio, removeFromPortfolio, addToWatchlist, removeFromWatchlist, addAlert, removeAlert } = usePortfolio()
  
  // Add command to history
  const addToHistory = (command: string) => {
    setCommandHistory(prev => [command, ...prev.slice(0, 49)])
  }
  
  // Clear command history
  const clearHistory = () => {
    setCommandHistory([])
  }
  
  // Define command handlers
  const helpCommand = (args: string[]): CommandResult => {
    // If specific command help is requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase()
      const command = commands[commandName] || Object.values(commands).find(cmd => 
        cmd.aliases?.includes(commandName)
      )
      
      if (command) {
        return {
          success: true,
          message: `Command: ${command.name}\n${command.description}\n\nUsage: ${command.usage}\nExamples:\n${command.examples.map(ex => `- ${ex}`).join('\n')}`
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
      'Fun': ['meme', 'drama', 'stonks'],
      'System': ['help', 'clear', 'history']
    }
    
    let helpText = 'Available Commands:\n'
    
    for (const [category, commandNames] of Object.entries(categories)) {
      helpText += `\n${category}:\n`
      for (const name of commandNames) {
        const command = commands[name]
        if (command) {
          helpText += `- ${command.name}: ${command.description.split('\n')[0]}\n`
        }
      }
    }
    
    helpText += '\nFor detailed help on a specific command, type: help [command]'
    
    return {
      success: true,
      message: helpText
    }
  }
  
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
  
  
  // Add command to history
  const addToHistory = (command: string) => {
    setCommandHistory(prev => [command, ...prev.slice(0, 49)])
  }
  
  // Clear command history
  const clearHistory = () => {
    setCommandHistory([])
  }
  
  // Define command handlers
  const helpCommand = (args: string[]): CommandResult => {
    // If specific command help is requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase()
      const command = commands[commandName] || Object.values(commands).find(cmd => cmd.aliases?.includes(commandName))
      
      if (command) {
        return {
          success: true,
          message: `Command: ${command.name}
${command.description}

Usage: ${command.usage}

Examples:
${command.examples.map(ex => `- ${ex}`).join('\n')}`
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
      'Fun': ['meme', 'drama', 'stonks'],
      'System': ['help', 'clear', 'history']
    }
    
    let helpText = 'Available Commands:\n'
    
    for (const [category, commandNames] of Object.entries(categories)) {
      helpText += `\n${category}:\n`
      for (const name of commandNames) {
        const command = commands[name]
        if (command) {
          helpText += `- ${command.name}: ${command.description.split('\n')[0]}\n`
        }
      }
    }
    
    helpText += '\nFor detailed help on a specific command, type: help [command]'
    
    return {
      success: true,
      message: helpText
    }
  }
  
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
          success: true,
          message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
        }
      }

      return {
        success: true,
        message: `Your Portfolio:\n${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice.toFixed(2)} | Current: $${h.currentPrice.toFixed(2)} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}\nTotal Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\n`
      }
    }

    if (index === "watchlist") {
      if (portfolio.watchlist.length === 0) {
        return {
          success: true,
          message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks."
        }
      }

      return {
        success: true,
        message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price.toFixed(2)} (${w.change > 0 ? "+" : ""}${w.change.toFixed(2)}%)`).join("\n")}`
      }
    }
    
    if (index === "alerts") {
      if (portfolio.alerts.length === 0) {
        return {
          success: true,
          message: "You have no price alerts set. Use 'alert set [symbol] [price] [above/below]' to create alerts."
        }
      }

      return {
        success: true,
        message: `Your Price Alerts:\n${portfolio.alerts.map((a) => `${a.symbol}: ${a.direction === "above" ? "↑" : "↓"} $${a.targetPrice.toFixed(2)}`).join("\n")}`
      }
    }
    
    return {
      success: false,
      message: `Unknown index: ${args[0]}. Try 'show sp500', 'show nasdaq', or 'show portfolio'`
    }
  }
  
  const portfolioCommand = (args: string[]): CommandResult => {
    if (portfolio.holdings.length === 0) {
      return {
        success: true,
        message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions."
      }
    }

    // Calculate total value and performance
    const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0) + portfolio.cash
    const totalCost = portfolio.holdings.reduce((sum, h) => sum + h.shares * h.avgPrice, 0) + portfolio.cash
    const totalReturn = totalValue - totalCost
    const totalReturnPct = (totalReturn / totalCost) * 100
    
    return {
      success: true,
      message: `Your Portfolio Summary:\n\nHoldings:\n${portfolio.holdings.map((h) => {
        const positionValue = h.shares * h.currentPrice
        const positionCost = h.shares * h.avgPrice
        const positionReturn = positionValue - positionCost
        const positionReturnPct = (positionReturn / positionCost) * 100
        return `${h.symbol}: ${h.shares} shares @ $${h.avgPrice.toFixed(2)} | Current: $${h.currentPrice.toFixed(2)} | Value: $${positionValue.toFixed(2)} | P/L: ${positionReturn > 0 ? "+" : ""}$${positionReturn.toFixed(2)} (${positionReturnPct > 0 ? "+" : ""}${positionReturnPct.toFixed(2)}%)`
      }).join("\n")}\n\nTotal Holdings Value: $${(totalValue - portfolio.cash).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\nTotal Portfolio Value: $${totalValue.toFixed(2)}\nTotal Return: ${totalReturn > 0 ? "+" : ""}$${totalReturn.toFixed(2)} (${totalReturnPct > 0 ? "+" : ""}${totalReturnPct.toFixed(2)}%)\n`
    }
  }
  
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

    // Mock price generation - in a real app, this would come from an API
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
        message: `Bought ${amount} shares of ${symbol} at $${price.toFixed(2)} for a total of $${totalCost.toFixed(2)}`
      }
    } else {
      return {
        success: false,
        message: `Failed to buy ${symbol}: ${result.error}`
      }
    }
  }
  
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
      const totalValue = holding.currentPrice * amount
      const profit = (holding.currentPrice - holding.avgPrice) * amount
      const profitPct = (profit / (holding.avgPrice * amount)) * 100
      
      return {
        success: true,
        message: `Sold ${amount} shares of ${symbol} at $${holding.currentPrice.toFixed(2)} for $${totalValue.toFixed(2)}\nProfit/Loss: ${profit > 0 ? "+" : ""}$${profit.toFixed(2)} (${profitPct > 0 ? "+" : ""}${profitPct.toFixed(2)}%)`
      }
    } else {
      return {
        success: false,
        message: `Failed to sell ${symbol}: ${result.error}`
      }
    }
  }
      handler: showCommand
    },
    portfolio: {
      name: 'portfolio',
      description: 'View your portfolio holdings and performance',
      usage: 'portfolio',
      examples: ['portfolio'],
      handler: portfolioCommand,
      aliases: ['p', 'holdings']
    },
    buy: {
      name: 'buy',
      description: 'Buy shares of a stock\nAdds the specified stock to your portfolio',
      usage: 'buy [symbol] [amount]',
      examples: ['buy AAPL 10', 'buy TSLA 5'],
      handler: buyCommand
    },
    sell: {
      name: 'sell',
      description: 'Sell shares of a stock from your portfolio',
      usage: 'sell [symbol] [amount]',
      examples: ['sell AAPL 5', 'sell TSLA 2'],
      handler: sellCommand
    },
    watchlist: {
      name: 'watchlist',
      description: 'Manage your stock watchlist\nAdd or remove stocks from your watchlist',
      usage: 'watchlist [add/remove] [symbol]',
      examples: ['watchlist add AAPL', 'watchlist remove TSLA', 'watchlist show'],
      handler: (args: string[]): CommandResult => {
        if (args.length === 0 || args[0] === 'show') {
          if (portfolio.watchlist.length === 0) {
            return {
              success: true,
              message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks."
            }
          }

          return {
            success: true,
            message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price.toFixed(2)} (${w.change > 0 ? "+" : ""}${w.change.toFixed(2)}%)`).join("\n")}`
          }
        }

        if (args.length < 2) {
          return {
            success: false,
            message: "Invalid format. Use 'watchlist [add/remove] [symbol]'"
          }
        }

        const action = args[0].toLowerCase()
        const symbol = args[1].toUpperCase()

        if (action === "add") {
          // Mock price and change - in a real app, this would come from an API
          const price = Math.floor(Math.random() * 500) + 50
          const change = (Math.random() * 10 - 5)

          const result = addToWatchlist(symbol, price, change)
          
          if (result.success) {
            return {
              success: true,
              message: `Added ${symbol} to your watchlist at $${price.toFixed(2)}`
            }
          } else {
            return {
              success: false,
              message: `Failed to add ${symbol} to watchlist: ${result.error}`
            }
          }
        }

        if (action === "remove") {
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
          message: "Invalid action. Use 'add' or 'remove'"
        }
      }
    },
    alert: {
      name: 'alert',
      description: 'Set price alerts for stocks\nGet notified when a stock reaches a certain price',
      usage: 'alert [set/remove] [symbol] [price] [above/below]',
      examples: ['alert set AAPL 150 above', 'alert remove TSLA 200', 'alert show'],
      handler: (args: string[]): CommandResult => {
        if (args.length === 0 || args[0] === 'show') {
          if (portfolio.alerts.length === 0) {
            return {
              success: true,
              message: "You have no price alerts set. Use 'alert set [symbol] [price] [above/below]' to create alerts."
            }
          }

          return {
            success: true,
            message: `Your Price Alerts:\n${portfolio.alerts.map((a) => `${a.symbol}: ${a.direction === "above" ? "↑" : "↓"} $${a.targetPrice.toFixed(2)}`).join("\n")}`
          }
        }

        const action = args[0].toLowerCase()

        if (action === "set") {
          if (args.length < 4) {
            return {
              success: false,
              message: "Invalid format. Use 'alert set [symbol] [price] [above/below]'"
            }
          }

          const symbol = args[1].toUpperCase()
          const price = Number.parseFloat(args[2])
          const direction = args[3].toLowerCase() as "above" | "below"

          if (isNaN(price) || price <= 0) {
            return {
              success: false,
              message: "Invalid price. Please enter a positive number."
            }
          }

          if (direction !== "above" && direction !== "below") {
            return {
              success: false,
              message: "Invalid direction. Use 'above' or 'below'."
            }
          }

          const result = addAlert(symbol, price, direction)
          
          if (result.success) {
            return {
              success: true,
              message: `Alert set for ${symbol} when price goes ${direction} $${price.toFixed(2)}`
            }
          } else {
            return {
              success: false,
              message: `Failed to set alert: ${result.error}`
            }
          }
        }

        if (action === "remove") {
          if (args.length < 3) {
            return {
              success: false,
              message: "Invalid format. Use 'alert remove [symbol] [price]'"
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

          const result = removeAlert(symbol, price)
          
          if (result.success) {
            return {
              success: true,
              message: `Alert for ${symbol} at $${price.toFixed(2)} has been removed`
            }
          } else {
            return {
              success: false,
              message: `Failed to remove alert: ${result.error}`
            }
          }
        }

        return {
          success: false,
          message: "Invalid action. Use 'set' or 'remove' or 'show'"
        }
      }
    },
    clear: {
      name: 'clear',
      description: 'Clear the terminal history',
      usage: 'clear',
      examples: ['clear'],
      handler: (): CommandResult => {
        return {
          success: true,
          message: "Terminal cleared. Type 'help' for available commands."
        }
      }
    },
    history: {
      name: 'history',
      description: 'Show command history',
      usage: 'history [count]',
      examples: ['history', 'history 5'],
      handler: (args: string[]): CommandResult => {
        const count = args.length > 0 ? parseInt(args[0]) : 10
        const historyToShow = commandHistory.slice(0, count)
        
        if (historyToShow.length === 0) {
          return {
            success: true,
            message: "No command history available."
          }
        }
        
        return {
          success: true,
          message: `Command History:\n${historyToShow.map((cmd, i) => `${i+1}. ${cmd}`).join("\n")}`
        }
      }
    }
  }
  
  // Command execution function
  const executeCommand = (command: string): string => {
    // Skip empty commands
    if (!command.trim()) return ""
    
    // Add to history
    addToHistory(command)
    
    // Parse the command and arguments
    const parts = command.toLowerCase().trim().split(/\s+/)
    const cmdName = parts[0]
    const args = parts.slice(1)
    
    // Find the command handler
    const commandObj = commands[cmdName] || Object.values(commands).find(cmd => cmd.aliases?.includes(cmdName))
    
    if (commandObj) {
      // Execute the command handler
      const result = commandObj.handler(args)
      return result.message
    }
    
    // Special case for compare command (not yet converted to new system)
    if (cmdName === "compare" && args.length >= 3 && args[1] === "vs") {
      const [a, _, b] = args
      return `Comparison: ${a.toUpperCase()} vs ${b.toUpperCase()}
${a.toUpperCase()}: +12.4% YTD | Volatility: Medium | P/E: 21.3
${b.toUpperCase()}: +8.7% YTD | Volatility: Low | P/E: 18.5
Correlation: 0.72 (strong)
Relative Strength: ${a.toUpperCase()} outperforming ${b.toUpperCase()} by 3.7%
Social Sentiment: ${a.toUpperCase()} more popular on social media
Institutional Flows: More inflows to ${b.toUpperCase()} in last 30 days`
    }
    
    // Special case for explain command (not yet converted to new system)
    if (cmdName === "explain" && args.length > 0) {
      const term = args.join(" ")
      
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
    
    // These commands are now handled by their respective command handlers
    
    // These commands are now handled by their respective command handlers

    // Unknown command
    return `Command not recognized: '${command}'. Type 'help' for available commands.`
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
  if (context === undefined) {
    throw new Error("useCommand must be used within a CommandProvider")
  }
  return context
}
