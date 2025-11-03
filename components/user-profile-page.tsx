"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/contexts/user-context'
import { getCurrentSession } from '@/lib/auth'
import { 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserPlus, 
  UserMinus,
  Settings,
  Crown,
  Activity,
  BarChart3
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  is_guest: boolean
  followers_count: number
  following_count: number
  total_score: number
  rank_tier: string
  created_at: string
  last_active: string
  stats: {
    portfolios_count: number
    total_trades: number
    avg_return: number
    best_day: number
    worst_day: number
  }
  recent_performance?: Array<{
    date: string
    value: number
    change: number
    change_percent: number
  }>
}

interface UserProfilePageProps {
  userId: string
  isOwnProfile?: boolean
}

export function UserProfilePage({ userId, isOwnProfile = false }: UserProfilePageProps) {
  const { user: currentUser } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const session = getCurrentSession()
      const headers: HeadersInit = {}
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.sessionToken}`
      }

      const response = await fetch(`/api/user/${userId}`, { headers })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load profile')
      }

      const profileData = await response.json()
      setProfile(profileData)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const session = getCurrentSession()
      if (!session) return

      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify({
          userId,
          action: isFollowing ? 'unfollow' : 'follow'
        })
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setProfile(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + (isFollowing ? -1 : 1)
        } : null)
      }
    } catch (error) {
      console.error('Failed to update follow status:', error)
    }
  }

  const getRankColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond': return 'text-cyan-400'
      case 'platinum': return 'text-gray-300'
      case 'gold': return 'text-yellow-400'
      case 'silver': return 'text-gray-400'
      case 'bronze': return 'text-orange-400'
      default: return 'text-gray-500'
    }
  }

  const getRankIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
      case 'platinum':
      case 'gold':
        return <Crown className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center p-8">
        <div className="text-red-400 mb-4">{error || 'Profile not found'}</div>
        <Button onClick={loadProfile} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{profile.avatar_url}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.is_guest && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      Guest
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-300 mt-2">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Last active {new Date(profile.last_active).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                className={isFollowing ? "border-gray-600" : "bg-cyan-600 hover:bg-cyan-700"}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{profile.followers_count}</div>
              <div className="text-sm text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{profile.following_count}</div>
              <div className="text-sm text-gray-400">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{profile.total_score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${getRankColor(profile.rank_tier)}`}>
                {getRankIcon(profile.rank_tier)}
                {profile.rank_tier}
              </div>
              <div className="text-sm text-gray-400">Rank</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Trading Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-medium">{profile.stats.total_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Portfolios</span>
                  <span className="text-white font-medium">{profile.stats.portfolios_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Return</span>
                  <span className={`font-medium ${profile.stats.avg_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profile.stats.avg_return >= 0 ? '+' : ''}{profile.stats.avg_return.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Day</span>
                  <span className="text-green-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{profile.stats.best_day.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Worst Day</span>
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {profile.stats.worst_day.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="text-white font-medium">{profile.followers_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Following</span>
                  <span className="text-white font-medium">{profile.following_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profile Visibility</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Public
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.recent_performance && profile.recent_performance.length > 0 ? (
                <div className="space-y-2">
                  {profile.recent_performance.map((perf, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                      <div>
                        <div className="text-white font-medium">
                          {new Date(perf.date).toLocaleDateString()}
                        </div>
                        <div className="text-gray-400 text-sm">
                          ${perf.value?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${(perf.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(perf.change_percent || 0) >= 0 ? '+' : ''}{(perf.change_percent || 0).toFixed(2)}%
                        </div>
                        <div className={`text-sm ${(perf.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(perf.change || 0) >= 0 ? '+' : ''}${(perf.change || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-8">
                Activity feed coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}