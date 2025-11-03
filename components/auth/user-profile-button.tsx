"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GuestConversionModal } from './guest-conversion-modal'
import { useUser } from '@/contexts/user-context'
import { Crown, Settings, User as UserIcon } from 'lucide-react'

export function UserProfileButton() {
  const [showConversionModal, setShowConversionModal] = useState(false)
  const { user, isGuest } = useUser()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-600">
        <span className="text-lg">{user.avatar_url}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {user.display_name || user.username}
          </span>
          {isGuest && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              Guest
            </span>
          )}
        </div>
      </div>

      {isGuest && (
        <Button
          onClick={() => setShowConversionModal(true)}
          size="sm"
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      )}

      <GuestConversionModal 
        open={showConversionModal} 
        onOpenChange={setShowConversionModal} 
      />
    </div>
  )
}