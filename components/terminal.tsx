"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import debounce from 'lodash.debounce'
import { useCommand } from "@/contexts/command-context"
import { TerminalIcon, ArrowRight, X, Maximize2, Minimize2, History, Download } from "lucide-react"
import { cn } from "@/lib/utils"

type HistoryItem = {
  type: "input" | "output"
  content: string
}

export default function Terminal() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: "output", content: "ECHO_MARKETS Terminal v0.2.0_beta" },
    { type: "output", content: 'Type "help" for available commands' },
  ])
  const [isMaximized, setIsMaximized] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showCommandHistory, setShowCommandHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const { executeCommand } = useCommand()

  // Debounced input handler
  const handleInputChange = useCallback(
    debounce((value: string) => {
      setInput(value)
    }, 200),
    []
  )

  // Optimized history render
  const HistoryList = useMemo(() => (
    <div 
      ref={historyRef}
      className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm"
    >
      {history.slice(0, 100).map((item, i) => (
        <div 
          key={i} 
          className={`${item.type === 'input' ? 'text-blue-400' : 'text-green-400'}`}
        >
          {item.type === 'input' ? (
            <div className="flex">
              <ArrowRight size={14} className="mr-1 mt-1 flex-shrink-0" />
              <span>{item.content}</span>
            </div>
          ) : (
            <div className="ml-5">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  ), [history])

  // Optimized command handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newHistory: HistoryItem[] = [
      ...history.slice(-99),
      { type: "input", content: input }
    ]
    
    setHistory(newHistory)
    setCommandHistory(prev => [input, ...prev.slice(0, 19)])
    setHistoryIndex(-1)

    try {
      const result = await executeCommand(input)
      setHistory([...newHistory, { type: "output", content: result }])
    } catch (error) {
      setHistory([...newHistory, { 
        type: "output", 
        content: `Error: ${error instanceof Error ? error.message : 'Command failed'}` 
      }])
    }

    setInput('')
    inputRef.current?.focus()
  }, [input, history, executeCommand])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Simple tab completion
      const commands = [
        "help",
        "show",
        "compare",
        "explain",
        "meme",
        "drama",
        "clear",
        "stonks",
        "portfolio",
        "buy",
        "sell",
        "watchlist",
        "alert",
        "news",
        "social",
        "trade",
      ]

      if (input) {
        const matches = commands.filter((cmd) => cmd.startsWith(input.toLowerCase()))
        if (matches.length === 1) {
          setInput(matches[0])
        } else if (matches.length > 1) {
          // Show possible completions
          setHistory((prev) => [...prev, { type: "output", content: `Possible completions: ${matches.join(", ")}` }])
        }
      }
    }
  }

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const clearTerminal = () => {
    setHistory([
      { type: "output", content: "ECHO_MARKETS Terminal v0.2.0_beta" },
      { type: "output", content: 'Type "help" for available commands' },
    ])
  }

  const downloadHistory = () => {
    const historyText = history.map((entry) => `${entry.type === "input" ? "> " : ""}${entry.content}`).join("\n")

    const blob = new Blob([historyText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "echo-markets-terminal-history.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden",
        isMaximized ? "col-span-3 row-span-2" : "",
      )}
    >
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <TerminalIcon size={14} className="mr-2" />
          <span className="text-xs font-semibold">COMMAND_LINE</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowCommandHistory(!showCommandHistory)}
            className="p-1 hover:bg-green-500/20 rounded"
            title="Command History"
          >
            <History size={12} />
          </button>
          <button onClick={downloadHistory} className="p-1 hover:bg-green-500/20 rounded" title="Download History">
            <Download size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button onClick={clearTerminal} className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {showCommandHistory && (
          <div className="w-48 border-r border-green-500/30 p-2 overflow-y-auto">
            <div className="text-xs font-bold mb-2">COMMAND HISTORY</div>
            {commandHistory.length === 0 ? (
              <div className="text-xs text-green-500/50">No commands yet</div>
            ) : (
              <div className="space-y-1">
                {commandHistory.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(cmd)
                      inputRef.current?.focus()
                    }}
                    className="text-xs block w-full text-left truncate hover:bg-green-500/10 p-1 rounded"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {HistoryList}

          <form onSubmit={handleSubmit} className="p-2 border-t border-green-500/30 flex">
            <ArrowRight size={14} className="mr-1 mt-1 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-blue-400 text-sm"
              placeholder="Type a command..."
              spellCheck="false"
              autoComplete="off"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
