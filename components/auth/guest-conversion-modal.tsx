"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { convertGuestToPermanent } from '@/lib/auth'
import { useUser } from '@/contexts/user-context'
import { Loader2, User, Mail, Lock, Crown } from 'lucide-react'

interface GuestConversionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuestConversionModal({ open, onOpenChange }: GuestConversionModalProps) {
  const { refreshSession } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: ''
  })

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await convertGuestToPermanent(
        form.username, 
        form.password, 
        form.email || undefined
      )
      await refreshSession()
      onOpenChange(false)
      setForm({ username: '', password: '', email: '' })
    } catch (err: any) {
      setError(err.message || 'Conversion failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/95 border border-yellow-500/30">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 text-xl font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-5 h-5" />
            Upgrade Your Account
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-center">
            Save your progress and unlock additional features by creating a permanent account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConvert} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="convert-username" className="text-gray-300">
              Choose Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="convert-username"
                type="text"
                value={form.username}
                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
                placeholder="Your unique username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-email" className="text-gray-300">
              Email (optional)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="convert-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
                placeholder="your@email.com"
              />
            </div>
            <p className="text-xs text-gray-400">
              Email helps with account recovery and notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-password" className="text-gray-300">
              Create Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="convert-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
                placeholder="Secure password (6+ characters)"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Maybe Later
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Upgrade Account
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-400 text-center">
          Your trading progress and achievements will be preserved
        </div>
      </DialogContent>
    </Dialog>
  )
}