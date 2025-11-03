import { randomBytes } from 'crypto'

export interface User {
  id: string
  username: string
  display_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  is_guest: boolean
  profile_public: boolean
  trades_public: boolean
  allow_copy_trading: boolean
  followers_count: number
  following_count: number
  total_score: number
  rank_tier: string
  created_at: Date
  last_active: Date
}

export interface AuthSession {
  user: User
  session_token: string
  expires_at: Date
}

/**
 * Generate a random avatar emoji for new users
 */
export function generateRandomAvatar(): string {
  const avatars = [
    '👾', '🤖', '🎮', '🚀', '⚡', '🔥', '💎', '🎯', '🎲', '🎪',
    '🌟', '💫', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🕹️', '🎰',
    '🦄', '🐉', '🦅', '🦈', '🐺', '🦁', '🐯', '🦊', '🐸', '🦋'
  ]
  return avatars[Math.floor(Math.random() * avatars.length)]
}

/**
 * Generate a random username for guest users
 */
export function generateGuestUsername(): string {
  const adjectives = [
    'swift', 'bold', 'clever', 'bright', 'sharp', 'quick', 'smart', 'wise',
    'brave', 'cool', 'epic', 'fast', 'keen', 'wild', 'zen', 'ace'
  ]
  const nouns = [
    'trader', 'bull', 'bear', 'wolf', 'eagle', 'shark', 'tiger', 'fox',
    'hawk', 'lion', 'ninja', 'wizard', 'knight', 'pilot', 'captain', 'chief'
  ]
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 9999)
  
  return `${adj}_${noun}_${num}`
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Get session expiry date (7 days from now)
 */
export function getSessionExpiry(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 7)
  return expiry
}

/**
 * Get current user session from localStorage
 */
export function getCurrentSession(): { userId: string; sessionToken: string } | null {
  if (typeof window === 'undefined') return null
  
  const userId = localStorage.getItem('echo_user_id')
  const sessionToken = localStorage.getItem('echo_session_token')
  
  if (!userId || !sessionToken) return null
  
  return { userId, sessionToken }
}

/**
 * Store session in localStorage
 */
export function storeSession(userId: string, sessionToken: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('echo_user_id', userId)
  localStorage.setItem('echo_session_token', sessionToken)
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('echo_user_id')
  localStorage.removeItem('echo_session_token')
  localStorage.removeItem('lattice_player_id') // Legacy cleanup
}

/**
 * Create a guest account and session
 */
export async function createGuestSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      console.warn('[auth] Failed to create guest session')
      return null
    }
    
    const session = await response.json()
    storeSession(session.user.id, session.session_token)
    
    return session
  } catch (error) {
    console.error('[auth] Guest session creation failed:', error)
    return null
  }
}

/**
 * Register a new permanent account
 */
export async function register(username: string, password: string, email?: string): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }
    
    const session = await response.json()
    storeSession(session.user.id, session.session_token)
    
    return session
  } catch (error) {
    console.error('[auth] Registration failed:', error)
    throw error
  }
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
    
    const session = await response.json()
    storeSession(session.user.id, session.session_token)
    
    return session
  } catch (error) {
    console.error('[auth] Login failed:', error)
    throw error
  }
}

/**
 * Convert guest account to permanent account
 */
export async function convertGuestToPermanent(username: string, password: string, email?: string): Promise<AuthSession | null> {
  try {
    const currentSession = getCurrentSession()
    if (!currentSession) {
      throw new Error('No active session to convert')
    }
    
    const response = await fetch('/api/auth/convert-guest', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.sessionToken}`
      },
      body: JSON.stringify({ username, password, email })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Conversion failed')
    }
    
    const session = await response.json()
    storeSession(session.user.id, session.session_token)
    
    return session
  } catch (error) {
    console.error('[auth] Guest conversion failed:', error)
    throw error
  }
}

/**
 * Validate current session and get user data
 */
export async function validateSession(): Promise<AuthSession | null> {
  try {
    const currentSession = getCurrentSession()
    if (!currentSession) return null
    
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentSession.sessionToken}`
      }
    })
    
    if (!response.ok) {
      clearSession()
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('[auth] Session validation failed:', error)
    clearSession()
    return null
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  try {
    const currentSession = getCurrentSession()
    if (currentSession) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.sessionToken}`
        }
      })
    }
  } catch (error) {
    console.error('[auth] Logout failed:', error)
  } finally {
    clearSession()
  }
}

/**
 * Ensures there is an authenticated session (guest or permanent) and
 * initializes user data via API.
 */
export async function ensureAuthSession(): Promise<AuthSession | null> {
  try {
    // First try to validate existing session
    const existingSession = await validateSession()
    if (existingSession) {
      return existingSession
    }
    
    // If no valid session, create a guest session
    return await createGuestSession()
  } catch (error) {
    console.error('[auth] Session initialization failed:', error)
    return null
  }
}

// Legacy function for backward compatibility
export async function ensureAnonSessionAndInit() {
  const session = await ensureAuthSession()
  return session ? { user: { id: session.user.id } } : null
}
