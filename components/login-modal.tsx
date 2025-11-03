"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Trophy, Zap } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (userData: { username: string; email?: string }) => void
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    
    try {
      // Simple validation
      const userData = {
        username: username.trim(),
        email: email.trim() || undefined
      }
      
      onLogin(userData)
      onClose()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPlay = () => {
    const randomNames = [
      'TraderPro', 'BullRider', 'MarketMaster', 'StockNinja', 'CryptoKing',
      'WallStreetWolf', 'DiamondHands', 'RocketTrader', 'MoneyMaker', 'TradingLegend'
    ]
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]
    const randomNumber = Math.floor(Math.random() * 9999)
    
    onLogin({ username: `${randomName}${randomNumber}` })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-gray-900 border-cyan-500/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-cyan-400">Join the Trading Arena</CardTitle>
          <CardDescription className="text-cyan-300">
            Start with $10,000 and compete for the top spot!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-cyan-300 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Trading Name
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your trading name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-800 border-gray-600 text-cyan-400 placeholder-gray-500"
                maxLength={20}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cyan-300 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-600 text-cyan-400 placeholder-gray-500"
              />
            </div>
            
            <Button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-black font-bold py-3"
            >
              {isLoading ? 'Starting Game...' : 'Start Trading'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or</span>
            </div>
          </div>
          
          <Button
            onClick={handleQuickPlay}
            variant="outline"
            className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Play (Random Name)
          </Button>
          
          <div className="text-center text-xs text-gray-400">
            No registration required • Start trading immediately
          </div>
        </CardContent>
      </Card>
    </div>
  )
}