"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthModal } from './auth-modal'
import { useUser } from '@/contexts/user-context'
import { LogIn, User, LogOut } from 'lucide-react'

export default function SignInBox() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isLoading, logout } = useUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded border border-cyan-500/30">
          <span className="text-lg">{user.avatar_url}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-cyan-400 truncate">
              {user.display_name || user.username}
            </div>
            {user.is_guest && (
              <div className="text-xs text-yellow-400">Guest Account</div>
            )}
          </div>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 w-full">
      <Button
        onClick={() => setShowAuthModal(true)}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Login / Register
      </Button>
      
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </div>
  )
}

