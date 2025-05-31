"use client"

import React, { useState } from "react";
import { List, Maximize2, Minimize2, X } from "lucide-react";
import { useGameEngine, Stock } from "@/contexts/game-engine-context";
import { useModule } from "@/contexts/module-context"; // Assuming a module context for visibility

export default function StockListModule() {
  const { state: engineState } = useGameEngine();
  const { stocks } = engineState;
  const { activeModules, toggleModule } = useModule(); // Assuming toggleModule for the X button
  const isVisible = activeModules.includes('stocklist'); // Assuming 'stocklist' is the ID for this module

  const [isMaximized, setIsMaximized] = useState(false);

  // if (!isVisible) return null; // Handled by ModuleManager or main layout

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <List size={14} className="mr-2" />
          <span className="text-xs font-semibold">STOCK_LIST</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded" title={isMaximized ? "Minimize" : "Maximize"}>
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          {/* Assuming X button might be handled by a general module wrapper or ModuleContext
          <button onClick={() => toggleModule('stocklist')} className="p-1 hover:bg-green-500/20 rounded" title="Close">
            <X size={12} />
          </button>
          */}
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {stocks.length === 0 ? (
          <div className="text-xs text-center py-4 text-green-500/50">No stocks available in the market.</div>
        ) : (
          <ul className="divide-y divide-green-500/20">
            {stocks.map((stock: Stock) => (
              <li key={stock.id} className="py-2 px-1 hover:bg-green-500/5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-sm">{stock.name} ({stock.symbol})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">${stock.price.toFixed(2)}</span>
                    {/* Future: Add price change indicator here */}
                  </div>
                </div>
                {/* Could add more details like volatility or a mini chart later */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
