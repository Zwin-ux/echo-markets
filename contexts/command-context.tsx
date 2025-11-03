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
  const { portfolio, addToPortfolio, removeFromPortfolio, addToWatchlist, removeFromWatchlist, addAlert, removeAlert } = usePortfolio()

  const addToHistory = (command: string) => {
    setCommandHistory((prev) => [command, ...prev.slice(0, 49)])
  }

  const clearHistory = () => setCommandHistory([])

  const showCommand: CommandHandler = (args) => {
    if (args.length === 0) {
      return { success: false, message: "Please specify what to show. Try 'show sp500', 'show nasdaq', or 'show portfolio'" }
    }
    const index = args[0].toLowerCase()
    if (["sp500", "s&p500", "s&p"].includes(index)) {
      return { success: true, message: "S&P 500: 4,327.12 (-1.2%) | YTD: +12.4% | P/E: 21.3 | Volatility: High" }
    }
    if (["nasdaq", "ndx"].includes(index)) {
      return { success: true, message: "NASDAQ: 14,723.45 (+0.8%) | YTD: +18.7% | Tech-heavy index mooning frfr" }
    }
    if (["btc", "bitcoin"].includes(index)) {
      return { success: true, message: "Bitcoin: $43,215.67 (+3.4%) | 24h Vol: $28.5B | No cap, still volatile | Social Sentiment: Bullish" }
    }
    if (["fed", "rates"].includes(index)) {
      return { success: true, message: "Fed Funds Rate: 5.25-5.50% | Next meeting: In 15 days | Market pricing in 0% chance of hike | Yield Curve: Inverted" }
    }
    if (index === "portfolio") {
      if (portfolio.holdings.length === 0) {
        return { success: false, message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions." }
      }
      return {
        success: true,
        message: `Your Portfolio:\n${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}\nTotal Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\n`
      }
    }
    if (index === "watchlist") {
      if (portfolio.watchlist.length === 0) {
        return { success: false, message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks." }
      }
      return { success: true, message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price} (${w.change > 0 ? "+" : ""}${w.change}%)`).join("\n")}\n` }
    }
    return { success: false, message: `Unknown index: ${args[0]}. Try 'show sp500' or 'show nasdaq'` }
  }

  const portfolioCommand: CommandHandler = () => {
    if (portfolio.holdings.length === 0) {
      return { success: false, message: "Your portfolio is empty. Use 'buy [symbol] [amount]' to add positions." }
    }
    return {
      success: true,
      message: `Your Portfolio:\n${portfolio.holdings.map((h) => `${h.symbol}: ${h.shares} shares @ $${h.avgPrice} | Current: $${h.currentPrice} | P/L: ${h.shares * (h.currentPrice - h.avgPrice) > 0 ? "+" : ""}$${(h.shares * (h.currentPrice - h.avgPrice)).toFixed(2)}`).join("\n")}\nTotal Value: $${portfolio.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0).toFixed(2)}\nCash: $${portfolio.cash.toFixed(2)}\n`
    }
  }

  const buyCommand: CommandHandler = (args) => {
    if (args.length < 2) return { success: false, message: "Invalid format. Use 'buy [symbol] [amount]'" }
    const symbol = args[0].toUpperCase()
    const amount = Number.parseInt(args[1])
    if (isNaN(amount) || amount <= 0) return { success: false, message: "Invalid amount. Please enter a positive number." }
    const price = Math.floor(Math.random() * 500) + 50
    const totalCost = price * amount
    if (totalCost > portfolio.cash) return { success: false, message: `Insufficient funds. You need $${totalCost.toFixed(2)} but have $${portfolio.cash.toFixed(2)}` }
    const result = addToPortfolio(symbol, amount, price)
    return result.success
      ? { success: true, message: `Bought ${amount} shares of ${symbol} at $${price} for a total of $${totalCost.toFixed(2)}` }
      : { success: false, message: `Failed to buy ${symbol}: ${result.error}` }
  }

  const sellCommand: CommandHandler = (args) => {
    if (args.length < 2) return { success: false, message: "Invalid format. Use 'sell [symbol] [amount]'" }
    const symbol = args[0].toUpperCase()
    const amount = Number.parseInt(args[1])
    if (isNaN(amount) || amount <= 0) return { success: false, message: "Invalid amount. Please enter a positive number." }
    const holding = portfolio.holdings.find((h) => h.symbol === symbol)
    if (!holding) return { success: false, message: `You don't own any shares of ${symbol}` }
    if (holding.shares < amount) return { success: false, message: `You only have ${holding.shares} shares of ${symbol}` }
    const result = removeFromPortfolio(symbol, amount, holding.currentPrice)
    return result.success
      ? { success: true, message: `Sold ${amount} shares of ${symbol} at $${holding.currentPrice} for a total of $${(holding.currentPrice * amount).toFixed(2)}` }
      : { success: false, message: `Failed to sell ${symbol}: ${result.error}` }
  }

  const watchlistCommand: CommandHandler = (args) => {
    if (args.length === 0) {
      if (portfolio.watchlist.length === 0) return { success: false, message: "Your watchlist is empty. Use 'watchlist add [symbol]' to add stocks." }
      return { success: true, message: `Your Watchlist:\n${portfolio.watchlist.map((w) => `${w.symbol}: $${w.price} (${w.change > 0 ? "+" : ""}${w.change}%)`).join("\n")}\n` }
    }
    if (args[0].toLowerCase() === "add") {
      if (args.length < 2) return { success: false, message: "Invalid format. Use 'watchlist add [symbol]'" }
      const symbol = args[1].toUpperCase()
      if (portfolio.watchlist.find((w) => w.symbol === symbol)) return { success: false, message: `You already have ${symbol} in your watchlist` }
      const result = addToWatchlist(symbol)
      return result.success ? { success: true, message: `Added ${symbol} to your watchlist` } : { success: false, message: `Failed to add ${symbol} to watchlist: ${result.error}` }
    }
    if (args[0].toLowerCase() === "remove") {
      if (args.length < 2) return { success: false, message: "Invalid format. Use 'watchlist remove [symbol]'" }
      const symbol = args[1].toUpperCase()
      if (!portfolio.watchlist.find((w) => w.symbol === symbol)) return { success: false, message: `${symbol} is not in your watchlist` }
      const result = removeFromWatchlist(symbol)
      return result.success ? { success: true, message: `Removed ${symbol} from your watchlist` } : { success: false, message: `Failed to remove ${symbol} from watchlist: ${result.error}` }
    }
    return { success: false, message: "Invalid watchlist command. Use 'watchlist add [symbol]' or 'watchlist remove [symbol]'" }
  }

  const alertCommand: CommandHandler = (args) => {
    if (args.length === 0) {
      if (portfolio.alerts.length === 0) return { success: false, message: "You have no active alerts. Use 'alert set [symbol] [price]' to set an alert." }
      return { success: true, message: `Your Alerts:\n${portfolio.alerts.map((a) => `${a.symbol}: $${a.price}`).join("\n")}\n` }
    }
    if (args[0].toLowerCase() === "set") {
      if (args.length < 3) return { success: false, message: "Invalid format. Use 'alert set [symbol] [price]'" }
      const symbol = args[1].toUpperCase()
      const price = Number.parseFloat(args[2])
      if (isNaN(price) || price <= 0) return { success: false, message: "Invalid price. Please enter a positive number." }
      const result = addAlert(symbol, price)
      return result.success ? { success: true, message: `Set alert for ${symbol} at $${price}` } : { success: false, message: `Failed to set alert for ${symbol}: ${result.error}` }
    }
    if (args[0].toLowerCase() === "remove") {
      if (args.length < 2) return { success: false, message: "Invalid format. Use 'alert remove [symbol]'" }
      const symbol = args[1].toUpperCase()
      if (!portfolio.alerts.find((a) => a.symbol === symbol)) return { success: false, message: `You don't have an alert set for ${symbol}` }
      const result = removeAlert(symbol)
      return result.success ? { success: true, message: `Removed alert for ${symbol}` } : { success: false, message: `Failed to remove alert for ${symbol}: ${result.error}` }
    }
    return { success: false, message: "Invalid alert command. Use 'alert set [symbol] [price]' or 'alert remove [symbol]'" }
  }

  const compareCommand: CommandHandler = (args) => {
    if (args.length < 2) return { success: false, message: "Invalid format. Use 'compare [symbol1] [symbol2]'" }
    const s1 = args[0].toUpperCase(); const s2 = args[1].toUpperCase()
    return { success: true, message: `Comparing ${s1} and ${s2}...` }
  }

  const commands: Record<string, CommandDefinition> = {
    help: {
      name: 'help', description: 'Show available commands or details for a specific command', usage: 'help [command]', examples: ['help', 'help buy', 'help show'],
      handler: (args) => {
        if (args.length > 0) {
          const commandName = args[0].toLowerCase()
          const command = commands[commandName] || Object.values(commands).find(cmd => cmd.aliases?.includes(commandName))
          if (command) return { success: true, message: `Command: ${command.name}\n${command.description}\n\nUsage: ${command.usage}\nExamples:\n${command.examples.map((ex: string) => `- ${ex}`).join('\n')}` }
          return { success: false, message: `No help available for '${args[0]}'. Type 'help' to see all available commands.` }
        }
        const categories: Record<string, string[]> = { 'Market Data': ['show', 'compare'], 'Education': ['explain'], 'Portfolio Management': ['portfolio', 'buy', 'sell'], 'Watchlist': ['watchlist'], 'Alerts': ['alert'], 'News & Social': ['news', 'social'], 'Fun': ['meme', 'drama', 'stonks'], 'System': ['help', 'clear', 'history'] }
        let helpText = 'Available Commands:\n'
        for (const [category, commandNames] of Object.entries(categories)) {
          helpText += `\n${category}:\n`
          for (const name of commandNames) {
            const command = commands[name]
            if (command) helpText += `- ${command.name}: ${command.description.split('\n')[0]}\n`
          }
        }
        helpText += '\nFor detailed help on a specific command, type: help [command]'
        return { success: true, message: helpText }
      }, aliases: ['?']
    },
    show: { name: 'show', description: 'Display market data (sp500, nasdaq, btc, fed) or portfolio/watchlist/alerts', usage: 'show <sp500|nasdaq|btc|fed|portfolio|watchlist|alerts>', examples: ['show sp500', 'show portfolio', 'show watchlist'], handler: showCommand, aliases: ['display'] },
    portfolio: { name: 'portfolio', description: 'Show your portfolio summary and performance', usage: 'portfolio', examples: ['portfolio'], handler: portfolioCommand },
    buy: { name: 'buy', description: 'Buy shares of a stock', usage: 'buy [symbol] [amount]', examples: ['buy AAPL 10', 'buy TSLA 2'], handler: buyCommand },
    sell: { name: 'sell', description: 'Sell shares of a stock', usage: 'sell [symbol] [amount]', examples: ['sell AAPL 5', 'sell TSLA 1'], handler: sellCommand },
    watchlist: { name: 'watchlist', description: 'Manage your watchlist (add/remove symbols)', usage: 'watchlist [add|remove] [symbol]', examples: ['watchlist add NVDA', 'watchlist remove MSFT'], handler: watchlistCommand },
    alert: { name: 'alert', description: 'Manage price alerts (set/remove)', usage: 'alert [set|remove] [symbol] [price]', examples: ['alert set AAPL 200', 'alert remove TSLA'], handler: alertCommand },
    compare: { name: 'compare', description: 'Compare performance of two symbols (mock)', usage: 'compare [symbol1] [symbol2]', examples: ['compare AAPL MSFT'], handler: compareCommand },
    clear: { name: 'clear', description: 'Clear the terminal output', usage: 'clear', examples: ['clear'], handler: () => ({ success: true, message: '' }) },
    history: { name: 'history', description: 'Show recently executed commands', usage: 'history', examples: ['history'], handler: () => ({ success: true, message: commandHistory.join('\n') || 'No history yet.' }) },
  }

  const executeCommand = (command: string): string => {
    const [cmd, ...args] = command.trim().split(/\s+/)
    const lower = (cmd || '').toLowerCase()
    const found = commands[lower] || Object.values(commands).find((c) => c.aliases?.includes(lower))
    if (found) {
      const res = found.handler(args)
      if (!res.success) toast({ title: 'Command error', description: res.message })
      return res.message
    }
    return `Unknown command: ${cmd}. Type 'help' for a list of commands.`
  }

  return (
    <CommandContext.Provider value={{ executeCommand, commandHistory, addToHistory, clearHistory, commands }}>
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

