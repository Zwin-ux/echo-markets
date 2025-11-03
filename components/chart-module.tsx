"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BarChart3, Maximize2, Minimize2, X, Download, RefreshCw } from "lucide-react"
import { useModule } from "@/contexts/module-context"
import { useSSE } from '@/lib/use-sse'
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

export default function ChartModule() {
  const { activeModules } = useModule()
  const isVisible = activeModules.includes('charts')
  const [isMaximized, setIsMaximized] = useState(false)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const { lastEvent, connected } = useSSE('/api/stream')

  // Compute top movers from SSE snapshot
  const prevRef = useRef<Map<string, number>>(new Map())
  const movers = useMemo(() => {
    const payload = lastEvent as any
    if (!payload || payload.type !== 'prices') return [] as { symbol: string; price: number; change: number }[]
    const prev = prevRef.current
    const out: { symbol: string; price: number; change: number }[] = []
    for (const item of payload.items as any[]) {
      const p0 = prev.get(item.symbol)
      const p1 = Number(item.price)
      if (p0 && p0 > 0) {
        const change = ((p1 - p0) / p0) * 100
        out.push({ symbol: item.symbol, price: p1, change })
      }
      prev.set(item.symbol, p1)
    }
    return out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5)
  }, [lastEvent])

  if (!isVisible) return null

  // Sample data
  const data = [
    { date: "Jan", sp500: 3800, nasdaq: 13000 },
    { date: "Feb", sp500: 3850, nasdaq: 13200 },
    { date: "Mar", sp500: 3900, nasdaq: 13100 },
    { date: "Apr", sp500: 4000, nasdaq: 13500 },
    { date: "May", sp500: 4100, nasdaq: 13700 },
    { date: "Jun", sp500: 4050, nasdaq: 13600 },
    { date: "Jul", sp500: 4200, nasdaq: 14000 },
    { date: "Aug", sp500: 4150, nasdaq: 13800 },
    { date: "Sep", sp500: 4300, nasdaq: 14200 },
  ]

  const handleDownload = () => {
    // Implement chart data export
    const csvContent = data.map(d => `${d.date},${d.sp500},${d.nasdaq}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'echo-markets-chart-data.csv'
    a.click()
  }

  return (
    <div className={`flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <BarChart3 size={14} className="mr-2" />
          <span className="text-xs font-semibold">MARKET_VISUALIZER</span>
        </div>
        <div className="flex space-x-1">
          <button className="p-1 hover:bg-green-500/20 rounded">
            <RefreshCw size={12} />
          </button>
          <button onClick={handleDownload} className="p-1 hover:bg-green-500/20 rounded">
            <Download size={12} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-bold">
            S&P 500 vs NASDAQ <span className="text-pink-500">bro GDP tanked frfr</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setChartType("line")}
              className={`text-xs px-2 py-1 rounded ${chartType === "line" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"}`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`text-xs px-2 py-1 rounded ${chartType === "bar" ? "bg-green-500/30" : "bg-green-500/10 hover:bg-green-500/20"}`}
            >
              Bar
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          <ChartContainer className="h-full">
            <Chart className="h-full">
              <LineChart data={data}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip>
                  <ChartTooltipContent />
                </ChartTooltip>
                <Line dataKey="sp500" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 6, fill: "#4ade80" }} />
                <Line dataKey="nasdaq" stroke="#f472b6" strokeWidth={2} activeDot={{ r: 6, fill: "#f472b6" }} />
              </LineChart>
            </Chart>
          </ChartContainer>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-green-500/5 p-2 rounded border border-green-500/20">
            <div className="text-xs font-bold mb-2">TOP MOVERS {connected ? '' : '(connecting...)'}</div>
            {movers.length === 0 ? (
              <div className="text-xs text-green-500/60">Waiting for stream…</div>
            ) : (
              <div className="space-y-1 text-xs">
                {movers.map(m => (
                  <div key={m.symbol} className="flex justify-between">
                    <span className="font-mono">{m.symbol}</span>
                    <span className={m.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-green-500/70 flex items-end justify-end">
            <div>Source: Echo Markets Stream • {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
