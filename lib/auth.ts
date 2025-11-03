/**
 * Ensures there is an authenticated session (anonymous to start) and
 * initializes user data (profiles, portfolio) via API.
 */
export async function ensureAnonSessionAndInit() {
  try {
    // Create or get anonymous session using our game API
    const response = await fetch('/api/game/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init' })
    })
    
    if (!response.ok) {
      console.warn('[auth] Failed to initialize player session')
      return null
    }
    
    const playerData = await response.json()
    
    // Store player ID in localStorage for session persistence
    if (playerData.playerId) {
      localStorage.setItem('lattice_player_id', playerData.playerId)
    }
    
    return { user: { id: playerData.playerId } }
  } catch (error) {
    console.error('[auth] Session initialization failed:', error)
    return null
  }
}
