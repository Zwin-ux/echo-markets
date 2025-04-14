'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tutorial } from '@/components/onboarding/tutorial'
import { useState, useEffect } from 'react'
import { track } from '@/lib/analytics'

export default function OnboardingPage() {
  const [showTutorial, setShowTutorial] = useState(false)
  
  useEffect(() => {
    track('Onboarding Viewed')
  }, [])

  const handleTutorialStart = () => {
    track('Tutorial Started')
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    track('Tutorial Completed')
    setShowTutorial(false)
  }

  const handleSkip = () => {
    track('Onboarding Skipped')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-green-900/10 p-4">
      {showTutorial ? (
        <Tutorial onComplete={handleTutorialComplete} />
      ) : (
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Welcome to Echo Markets</h1>
          <p className="text-green-200 mb-8">
            Your daily $100 trading challenge. Test your skills and climb the leaderboard!
          </p>
          
          <div className="space-y-4">
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
              <h3 className="font-semibold text-green-300 mb-2">How It Works</h3>
              <ul className="text-left text-green-100 space-y-2 text-sm">
                <li>• Start with $100 every day</li>
                <li>• Trade simulated stocks</li>
                <li>• Track your performance</li>
                <li>• Compete on the leaderboard</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleTutorialStart}
              className="w-full bg-green-500/90 hover:bg-green-600 text-black font-bold"
            >
              Take Quick Tour
            </Button>
            
            <Link href="/trading" className="block" onClick={handleSkip}>
              <Button variant="outline" className="w-full text-green-400 border-green-500/50">
                Skip to Trading
              </Button>
            </Link>
            
            <p className="text-xs text-green-500/70">
              No account needed - progress saved in your browser
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
