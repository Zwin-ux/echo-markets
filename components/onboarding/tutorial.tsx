'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/error-boundary'

type Step = {
  title: string
  content: string
  selector?: string
}

export function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <h3 className="text-red-400 font-bold mb-2">Tutorial Error</h3>
        <p className="text-red-300 mb-4">{error}</p>
        <Button 
          onClick={() => setError(null)}
          className="bg-red-500 hover:bg-red-600"
        >
          Restart Tutorial
        </Button>
      </div>
    )
  }

  const steps: Step[] = [
    {
      title: 'Daily $100 Challenge',
      content: 'Start fresh each day with $100 to trade simulated stocks.'
    },
    {
      title: 'Trading Interface',
      content: 'Buy and sell stocks using the simple trading panel.',
      selector: '#trading-module'
    },
    {
      title: 'Portfolio Tracking',
      content: 'Monitor your holdings and daily performance.',
      selector: '#portfolio-module'
    },
    {
      title: 'Leaderboard',
      content: 'Compete with others based on your daily returns.',
      selector: '#leaderboard-module'
    }
  ]

  const handleNext = () => {
    try {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        onComplete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown tutorial error')
    }
  }

  const handlePrev = () => {
    try {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown tutorial error')
    }
  }

  return (
    <ErrorBoundary fallback={<div className="text-red-400">Tutorial failed</div>}>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-green-900/90 border border-green-500/30 rounded-lg p-6 max-w-md mx-auto"
          style={steps[currentStep].selector ? { marginLeft: '200px' } : {}}
        >
          <h3 className="text-xl font-bold text-green-400 mb-2">{steps[currentStep].title}</h3>
          <p className="text-green-100 mb-6">{steps[currentStep].content}</p>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-green-400 border-green-500/50"
            >
              Back
            </Button>
            
            <div className="flex space-x-2">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-green-400' : 'bg-green-500/30'}`}
                />
              ))}
            </div>
            
            <Button 
              onClick={handleNext}
              className="bg-green-500 hover:bg-green-600 text-black"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
