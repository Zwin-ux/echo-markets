"use client"

import { useState } from "react"
import { MessageSquare, Maximize2, Minimize2, X, RefreshCw, Download } from "lucide-react"

export default function NarratorModule() {
  const [isMaximized, setIsMaximized] = useState(false)

  const handleDownload = () => {
    const content = document.querySelector('.narrator-content')?.textContent || ''
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'market-narrative.txt'
    a.click()
  }

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <MessageSquare size={14} className="mr-2" />
          <span className="text-xs font-semibold">MARKET_NARRATOR</span>
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

      <div className="flex-1 p-3 overflow-y-auto narrator-content">
        <div className="mb-4">
          <div className="text-xs font-bold mb-1 text-blue-400">MARKET STORY</div>
          <div className="text-sm bg-green-500/5 p-2 rounded border border-green-500/20">
            S&P 500 just hit a 3-month high while tech stocks are having their moment. The Fed is basically your rich
            friend who keeps bailing you out, but the party might end soon. Inflation's cooling but still spicy. Vibes
            are cautiously optimistic.
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold mb-1 text-pink-500">DRAMA ALERT</div>
          <div className="text-sm bg-pink-500/5 p-2 rounded border border-pink-500/20">
            Tech CEOs are fighting on social media again while their stocks are mooning. Classic correlation between CEO
            Twitter drama and market gains continues to hold.
          </div>
        </div>

        <div>
          <div className="text-xs font-bold mb-1 text-yellow-400">WHAT TO WATCH</div>
          <div className="text-sm bg-yellow-500/5 p-2 rounded border border-yellow-500/20">
            Keep an eye on tomorrow's jobs report. If it slaps, markets could pop off. If it flops, expect the Fed to
            enter damage control mode. Either way, volatility incoming.
          </div>
        </div>
      </div>
    </div>
  )
}
