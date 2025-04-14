"use client"

import { useState } from "react"
import { BarChart3, Maximize2, Minimize2, X, Download, RefreshCw } from "lucide-react"
import { useModule } from "@/contexts/module-context"
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

        <div className="mt-2 flex justify-between text-xs text-green-500/70">
          <div>Source: Echo Markets Data</div>
          <div>Updated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )
}
