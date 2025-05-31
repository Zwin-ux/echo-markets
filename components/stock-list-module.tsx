"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Stock } from '@/lib/models';
import { fetcher } from '@/lib/api';
import { useGameEngine, GameEvent } from '@/contexts/game-engine-context'; // To listen for tick updates, import GameEvent
import { BarChartHorizontalBig } from 'lucide-react'; // Icon for placeholder

// Define a type for the API response from GET /api/tick
interface ApiTickGetResponse {
  tick: number;
  stocks: Stock[];
  // other fields like newsEvents, player might be present
}

export default function StockListModule() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribe } = useGameEngine(); // Removed engineState as it's not directly used

  const fetchStocks = useCallback(async () => {
    // Don't set isLoading to true here if stocks already exist, to avoid layout shift
    // It will be set by the caller if it's an initial load.
    // setIsLoading(true);
    setError(null);
    try {
      // Fetch current stock data. The GET /api/tick endpoint returns current stocks.
      const data = await fetcher<ApiTickGetResponse>('/api/tick');
      setStocks(data.stocks);
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
      setError("Failed to load stock data. Please try again later.");
    } finally {
      setIsLoading(false); // Set loading to false after fetch attempt
    }
  }, []);

  useEffect(() => {
    // Fetch initial stock data
    setIsLoading(true); // Set loading true for the initial fetch
    fetchStocks();
  }, [fetchStocks]);

  useEffect(() => {
    // Subscribe to tick_advanced events to refresh stock data
    const handleGameEvent = (event: GameEvent) => { // Use imported GameEvent type
      if (event.type === 'tick_advanced') {
        // The API response from POST /api/tick also contains stocks.
        // The GameEngineContext's 'tick_advanced' event now includes stocks in its payload.
        if (event.payload && event.payload.stocks) {
          setStocks(event.payload.stocks);
          setIsLoading(false); // Assuming stocks are updated, so loading is done
        } else {
          // Fallback to refetch if payload.stocks is not available
          setIsLoading(true);
          fetchStocks();
        }
      } else if (event.type === 'initial_state_loaded') {
        // initial_state_loaded might also carry initial stocks via its payload from GET /api/tick
        // For now, we rely on the initial fetchStocks call.
        // If GameEngine's initial_state_loaded event provided stocks, we could use them:
        // if (event.payload && event.payload.stocks) {
        //   setStocks(event.payload.stocks);
        //   setIsLoading(false);
        // } else {
        // For consistency, or if initial_state_loaded doesn't yet provide stocks:
           setIsLoading(true);
           fetchStocks();
        // }
      }
    };

    const unsubscribe = subscribe(handleGameEvent);
    return () => unsubscribe();
  }, [subscribe, fetchStocks]);

  if (isLoading && stocks.length === 0) { // Show loader only on initial load (no stocks yet)
    return (
      <div className="p-4 bg-black border border-green-500/30 rounded-sm text-center">
        <p className="text-green-400">Loading Stocks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-black border border-red-500/30 rounded-sm text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (stocks.length === 0 && !isLoading) { // Check !isLoading to show after initial load attempt
    return (
      <div className="p-4 bg-black border border-yellow-500/30 rounded-sm text-center">
        <p className="text-yellow-400">No stocks available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-black border border-green-500/30 rounded-sm p-4 text-white">
      <h2 className="text-xl font-semibold mb-3 text-green-400">STOCKS OVERVIEW</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-green-500/30">
          <thead className="bg-green-500/10">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Symbol
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Volatility
              </th>
               <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Momentum
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Last Updated
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                Chart
              </th>
            </tr>
          </thead>
          <tbody className="bg-black divide-y divide-green-500/50">
            {stocks.map((stock) => (
              <tr key={stock.symbol} className="hover:bg-green-500/5 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-400">{stock.symbol}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{stock.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {/* Price color based on momentum is a good idea, ensure momentum is updated in API or derived */}
                  <span className={stock.momentum >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${stock.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{(stock.volatility * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{(stock.momentum * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {new Date(stock.last_updated).toLocaleTimeString()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <BarChartHorizontalBig size={20} className="text-blue-500 opacity-50" titleAccess="Price graph (placeholder)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {isLoading && stocks.length > 0 && <p className="text-xs text-green-500/70 mt-2 text-center">Updating stocks...</p>}
    </div>
  );
}
