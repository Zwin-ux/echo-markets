"use client"

import { useState } from "react"
import { Globe, Maximize2, Minimize2, X, Play, Pause, RotateCcw } from "lucide-react"
import { useModule } from "@/contexts/module-context"

export default function SimulationModule() {
  const { activeModules } = useModule()
  const isVisible = activeModules.includes('simulation')
  const [isMaximized, setIsMaximized] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState("usa")
  const [interestRate, setInterestRate] = useState(5)
  const [taxRate, setTaxRate] = useState(25)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<null | {
    gdp: number
    inflation: number
    unemployment: number
    sentiment: string
  }>(null)

  if (!isVisible) return null

  const countries = [
    { id: "usa", name: "United States" },
    { id: "eu", name: "European Union" },
    { id: "jpn", name: "Japan" },
    { id: "chn", name: "China" },
  ]

  const runSimulation = () => {
    setIsSimulating(true)

    // Simulate API call with timeout
    setTimeout(() => {
      // Simple mock simulation results based on inputs
      const gdpImpact = (5 - interestRate) * 0.5 + (taxRate - 25) * -0.1
      const inflationImpact = (5 - interestRate) * -0.3 + (taxRate - 25) * 0.05

      setSimulationResults({
        gdp: Number.parseFloat((2.5 + gdpImpact).toFixed(1)),
        inflation: Number.parseFloat((3.2 + inflationImpact).toFixed(1)),
        unemployment: Number.parseFloat((4.5 - gdpImpact * 0.2).toFixed(1)),
        sentiment: gdpImpact > 0 ? "bullish" : "bearish",
      })

      setIsSimulating(false)
    }, 1500)
  }

  const resetSimulation = () => {
    setInterestRate(5)
    setTaxRate(25)
    setSimulationResults(null)
  }

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'relative'} transition-all duration-200 flex flex-col bg-black border border-green-500/30 rounded-sm overflow-hidden`}>
      <div className="flex items-center justify-between p-2 bg-green-500/10 border-b border-green-500/30">
        <div className="flex items-center">
          <Globe size={14} className="mr-2" />
          <span className="text-xs font-semibold">POLICY_SIMULATOR</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-green-500/20 rounded">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-green-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="mb-4">
          <div className="text-xs font-bold mb-2">SELECT REGION</div>
          <div className="grid grid-cols-2 gap-2">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country.id)}
                className={`text-xs p-2 rounded border ${
                  selectedCountry === country.id
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                }`}
              >
                {country.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold mb-2">POLICY LEVERS</div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Interest Rate: {interestRate}%</span>
              <span className="text-green-500/70">Default: 5%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(Number.parseFloat(e.target.value))}
              className="w-full accent-green-500 bg-green-500/20 h-1 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1 text-green-500/50">
              <span>Dovish</span>
              <span>Hawkish</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Tax Rate: {taxRate}%</span>
              <span className="text-green-500/70">Default: 25%</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(Number.parseInt(e.target.value))}
              className="w-full accent-green-500 bg-green-500/20 h-1 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1 text-green-500/50">
              <span>Low Tax</span>
              <span>High Tax</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex-1 flex items-center justify-center text-xs p-2 rounded bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <>
                <Pause size={12} className="mr-1" />
                Simulating...
              </>
            ) : (
              <>
                <Play size={12} className="mr-1" />
                Run Simulation
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center justify-center text-xs p-2 rounded bg-green-500/10 hover:bg-green-500/20"
          >
            <RotateCcw size={12} className="mr-1" />
            Reset
          </button>
        </div>

        {simulationResults && (
          <div className="bg-green-500/5 p-2 rounded border border-green-500/20">
            <div className="text-xs font-bold mb-2 text-blue-400">SIMULATION RESULTS</div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-black/50 p-2 rounded">
                <div className="text-xs text-green-500/70">GDP Growth</div>
                <div
                  className={`text-lg font-bold ${simulationResults.gdp >= 2.5 ? "text-green-400" : "text-red-400"}`}
                >
                  {simulationResults.gdp}%
                </div>
              </div>

              <div className="bg-black/50 p-2 rounded">
                <div className="text-xs text-green-500/70">Inflation</div>
                <div
                  className={`text-lg font-bold ${simulationResults.inflation <= 3 ? "text-green-400" : "text-red-400"}`}
                >
                  {simulationResults.inflation}%
                </div>
              </div>

              <div className="bg-black/50 p-2 rounded">
                <div className="text-xs text-green-500/70">Unemployment</div>
                <div
                  className={`text-lg font-bold ${simulationResults.unemployment <= 5 ? "text-green-400" : "text-red-400"}`}
                >
                  {simulationResults.unemployment}%
                </div>
              </div>

              <div className="bg-black/50 p-2 rounded">
                <div className="text-xs text-green-500/70">Market Sentiment</div>
                <div
                  className={`text-lg font-bold ${simulationResults.sentiment === "bullish" ? "text-green-400" : "text-red-400"}`}
                >
                  {simulationResults.sentiment.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="text-xs">
              {simulationResults.gdp >= 3 ? (
                <span className="text-green-400">Economy's absolutely bussin rn, no cap</span>
              ) : simulationResults.gdp >= 2 ? (
                <span className="text-yellow-400">Mid economy vibes, could be better fr</span>
              ) : (
                <span className="text-red-400">Economy down bad, major L</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
