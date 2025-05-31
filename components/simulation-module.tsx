"use client";

import { useState, useEffect } from "react";
import { Globe, Maximize2, Minimize2, Play, Pause, RotateCcw, Zap } from "lucide-react"; // Added Zap, removed X
import { useModule } from "@/contexts/module-context";
import { useGameEngine, GameEvent } from "@/contexts/game-engine-context"; // Import GameEvent

export default function SimulationModule() {
  const { activeModules } = useModule();
  const isVisible = activeModules.includes('simulation');
  const [isMaximized, setIsMaximized] = useState(false);

  // Policy simulator states
  const [selectedCountry, setSelectedCountry] = useState("usa");
  const [interestRate, setInterestRate] = useState(5);
  const [taxRate, setTaxRate] = useState(25);
  const [isPolicySimulating, setIsPolicySimulating] = useState(false); // Renamed
  const [policySimulationResults, setPolicySimulationResults] = useState<null | { // Renamed
    gdp: number;
    inflation: number;
    unemployment: number;
    sentiment: string;
    eventImpact?: string;
  }>(null);

  // Game engine integration for market tick
  const { state: engineState, subscribe, advanceTick } = useGameEngine();
  const [isMarketTickLoading, setIsMarketTickLoading] = useState(false);

  // Listen for market_news events (from policy sim's perspective, if relevant)
  useEffect(() => {
    const listener = (event: GameEvent) => { // Use GameEvent type
      if (event.type === "market_news" && event.payload) {
        // Assuming event.payload is a NewsEvent object
        const newsPayload = event.payload as any; // Cast to any if NewsEvent model is not directly used here
         // Check if this news event originated from something other than the global market tick API to avoid echo
        if (newsPayload.source !== 'market_tick_api') {
            setPolicySimulationResults(prev => {
            const baseResults = prev || { // Create a default structure if prev is null
                gdp: 2.5,
                inflation: 3.2,
                unemployment: 4.5,
                sentiment: newsPayload.impact_score > 0 ? 'bullish' : 'bearish',
            };
            return {
                ...baseResults,
                eventImpact: `${newsPayload.title} (Impact: ${newsPayload.impact_score > 0 ? 'Positive' : 'Negative'})`
            };
            });
        }
      }
    };
    const unsubscribe = subscribe(listener);
    return () => unsubscribe();
  }, [subscribe]);

  if (!isVisible) return null;

  const countries = [
    { id: "usa", name: "United States" },
    { id: "eu", name: "European Union" },
    { id: "china", name: "China" },
    { id: "japan", name: "Japan" },
  ];

  const runPolicySimulation = () => {
    setIsPolicySimulating(true);
    setPolicySimulationResults(prev => prev ? { ...prev, eventImpact: undefined } : null); // Clear previous event impact
    setTimeout(() => {
      const gdpImpact = (5 - interestRate) * 0.5 + (taxRate - 25) * -0.1;
      const inflationImpact = (5 - interestRate) * -0.3 + (taxRate - 25) * 0.05;
      setPolicySimulationResults(prev => ({
        ...(prev || { gdp: 2.5, inflation: 3.2, unemployment: 4.5, sentiment: 'neutral' }), // Ensure prev exists or provide default
        gdp: parseFloat((2.5 + gdpImpact).toFixed(1)),
        inflation: parseFloat((3.2 + inflationImpact).toFixed(1)),
        unemployment: parseFloat((4.5 - gdpImpact * 0.2).toFixed(1)),
        sentiment: gdpImpact > 0 ? "bullish" : gdpImpact < 0 ? "bearish" : "neutral",
      }));
      setIsPolicySimulating(false);
    }, 1500);
  };

  const resetPolicySimulation = () => {
    setInterestRate(5);
    setTaxRate(25);
    setPolicySimulationResults(null);
    setIsPolicySimulating(false);
  };

  const handleAdvanceMarketTick = async () => {
    setIsMarketTickLoading(true);
    try {
      await advanceTick();
    } catch (error) {
      console.error("Failed to advance market tick from UI:", error);
      // Optionally show an error message to the user (e.g., using a toast notification or an error state)
    } finally {
      setIsMarketTickLoading(false);
    }
  };

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black/90 backdrop-blur-sm' : 'relative'} transition-all duration-300 ease-in-out flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Globe size={14} className="mr-2 text-green-400" />
          <span className="text-xs font-semibold text-green-300">SIMULATION_CONTROLS</span>
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-sm">
                Tick: {engineState.isLoading && engineState.tick === 0 ? 'Loading...' : engineState.tick}
            </span>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded" title={isMaximized ? "Minimize" : "Maximize"}>
            {isMaximized ? <Minimize2 size={12} className="text-green-400" /> : <Maximize2 size={12} className="text-green-400" />}
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-5 custom-scrollbar">
        {/* Market Tick Control Section */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-green-400">Market Clock</h3>
          <button
            onClick={handleAdvanceMarketTick}
            disabled={isMarketTickLoading || (engineState.isLoading && engineState.tick === 0)}
            className="w-full flex items-center justify-center text-sm p-2.5 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 hover:text-blue-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isMarketTickLoading ? (
              <>
                <RotateCcw size={16} className="mr-2 animate-spin" />
                Processing Tick...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Advance Market to Tick ({engineState.isLoading && engineState.tick === 0 ? 1 : engineState.tick + 1})
              </>
            )}
          </button>
           {(engineState.isLoading && engineState.tick === 0) && <p className="text-xs text-center mt-1.5 text-yellow-400/80">Initializing game state...</p>}
        </div>

        {/* Existing Policy Simulator Section */}
        <div className="border-t border-green-500/30 pt-4">
          <h3 className="text-sm font-semibold mb-3 text-green-400">Economic Policy Simulator</h3>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1 text-gray-400">Region</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full text-xs p-2 rounded bg-gray-700/30 border border-gray-600/50 text-gray-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1 text-gray-400">Interest Rate: <span className="font-bold text-purple-400">{interestRate.toFixed(2)}%</span> (Default: 5%)</label>
            <input
              type="range" min="0" max="10" step="0.25" value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1 text-gray-400">Tax Rate: <span className="font-bold text-purple-400">{taxRate}%</span> (Default: 25%)</label>
            <input
              type="range" min="10" max="40" step="1" value={taxRate}
              onChange={(e) => setTaxRate(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="flex space-x-2 mb-3">
            <button
              onClick={runPolicySimulation}
              disabled={isPolicySimulating}
              className="flex-1 flex items-center justify-center text-xs p-2 rounded bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 hover:text-purple-200 disabled:opacity-60 transition-colors"
            >
              {isPolicySimulating ? <><RotateCcw size={14} className="mr-1.5 animate-spin" />Calculating...</> : <><Play size={14} className="mr-1.5" />Run Policy Sim</>}
            </button>
            <button
              onClick={resetPolicySimulation}
              title="Reset Policy Levers"
              className="p-2 rounded bg-gray-600/30 hover:bg-gray-600/40 text-gray-300 hover:text-gray-200 transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {policySimulationResults && (
            <div className="bg-black/30 p-3 rounded border border-green-500/20 mt-3">
              <h4 className="text-xs font-semibold mb-2 text-purple-300">POLICY SIMULATION OUTPUT</h4>
              <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                {[
                    { label: "Est. GDP Growth", value: `${policySimulationResults.gdp}%`, positive: policySimulationResults.gdp >= 2.5 },
                    { label: "Est. Inflation", value: `${policySimulationResults.inflation}%`, positive: policySimulationResults.inflation <= 3.2 },
                    { label: "Est. Unemployment", value: `${policySimulationResults.unemployment}%`, positive: policySimulationResults.unemployment <= 4.5 },
                    { label: "Market Sentiment", value: policySimulationResults.sentiment, positive: policySimulationResults.sentiment === 'bullish' }
                ].map(res => (
                    <div key={res.label} className="bg-green-500/5 p-1.5 rounded">
                        <div className="text-gray-400">{res.label}</div>
                        <div className={`font-bold ${res.positive ? "text-green-400" : "text-red-400"}`}>{res.value}</div>
                    </div>
                ))}
              </div>
              {policySimulationResults.eventImpact && <p className="text-xs text-yellow-400/90 mt-1"><span className="font-semibold">External Factor:</span> {policySimulationResults.eventImpact}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
