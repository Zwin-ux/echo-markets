"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/contexts/user-context'
import { getCurrentSession } from '@/lib/auth'
import { Save, User, Shield, Eye, Copy } from 'lucide-react'

export function ProfileSettings() {
  const { user, refreshSession } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [settings, setSettings] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    profile_public: true,
    trades_public: true,
    allow_copy_trading: false
  })

  useEffect(() => {
    if (user) {
      setSettings({
        display_name: user.display_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        profile_public: user.profile_public,
        trades_public: user.trades_public,
        allow_copy_trading: user.allow_copy_trading
      })
    }
  }, [user])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const session = getCurrentSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }

      await refreshSession()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const avatarOptions = [
    '👾', '🤖', '🎮', '🚀', '⚡', '🔥', '💎', '🎯', '🎲', '🎪',
    '🌟', '💫', '🎨', '🎭', '🦄', '🐉', '🦅', '🦈', '🐺', '🦁',
    '🐯', '🦊', '🐸', '🦋', '🎸', '🎵', '🎤', '🎧', '🎹', '🥁'
  ]

  if (!user) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400">Please log in to access profile settings</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Customize your profile and privacy settings</p>
      </div>

      {/* Profile Information */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-gray-300">
              Display Name
            </Label>
            <Input
              id="display-name"
              value={settings.display_name}
              onChange={(e) => setSettings(prev => ({ ...prev, display_name: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="How others see your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-gray-300">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-400 text-right">
              {settings.bio.length}/200 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Avatar</Label>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{settings.avatar_url}</div>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.slice(0, 10).map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSettings(prev => ({ ...prev, avatar_url: avatar }))}
                    className={`text-2xl p-2 rounded hover:bg-gray-700 transition-colors ${
                      settings.avatar_url === avatar ? 'bg-cyan-600' : 'bg-gray-800'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-4 h-4" />
                Public Profile
              </div>
              <p className="text-sm text-gray-400">
                Allow others to view your profile and stats
              </p>
            </div>
            <Switch
              checked={settings.profile_public}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, profile_public: checked }))}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-white">Public Trades</div>
              <p className="text-sm text-gray-400">
                Show your trades in the public feed
              </p>
            </div>
            <Switch
              checked={settings.trades_public}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, trades_public: checked }))}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white">
                <Copy className="w-4 h-4" />
                Allow Copy Trading
              </div>
              <p className="text-sm text-gray-400">
                Let others automatically copy your trades
              </p>
            </div>
            <Switch
              checked={settings.allow_copy_trading}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_copy_trading: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded p-2">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/30 rounded p-2">
            Profile updated successfully!
          </div>
        )}
      </div>

      {user.is_guest && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-yellow-400 text-sm text-center">
              <strong>Guest Account:</strong> Your settings are saved locally. 
              Consider upgrading to a permanent account to sync across devices.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}