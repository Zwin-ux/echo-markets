import { 
  generateRandomAvatar, 
  generateGuestUsername, 
  generateSessionToken,
  getSessionExpiry,
  getCurrentSession,
  storeSession,
  clearSession
} from '@/lib/auth'

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateRandomAvatar', () => {
    it('should return a valid emoji avatar', () => {
      const avatar = generateRandomAvatar()
      expect(typeof avatar).toBe('string')
      expect(avatar.length).toBeGreaterThan(0)
    })

    it('should return different avatars on multiple calls', () => {
      const avatars = new Set()
      for (let i = 0; i < 10; i++) {
        avatars.add(generateRandomAvatar())
      }
      // Should have some variety (not all the same)
      expect(avatars.size).toBeGreaterThan(1)
    })
  })

  describe('generateGuestUsername', () => {
    it('should return a valid guest username format', () => {
      const username = generateGuestUsername()
      expect(typeof username).toBe('string')
      expect(username).toMatch(/^[a-z]+_[a-z]+_\d+$/)
    })

    it('should return different usernames on multiple calls', () => {
      const usernames = new Set()
      for (let i = 0; i < 10; i++) {
        usernames.add(generateGuestUsername())
      }
      // Should have some variety
      expect(usernames.size).toBeGreaterThan(1)
    })
  })

  describe('generateSessionToken', () => {
    it('should return a valid session token', () => {
      const token = generateSessionToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('should return different tokens on multiple calls', () => {
      const token1 = generateSessionToken()
      const token2 = generateSessionToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('getSessionExpiry', () => {
    it('should return a date 7 days in the future', () => {
      const now = new Date()
      const expiry = getSessionExpiry()
      const diffInDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffInDays).toBeCloseTo(7, 1)
    })
  })

  describe('session storage', () => {
    const mockUserId = 'user123'
    const mockToken = 'token456'

    describe('storeSession', () => {
      it('should store user ID and session token in localStorage', () => {
        storeSession(mockUserId, mockToken)
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith('echo_user_id', mockUserId)
        expect(localStorageMock.setItem).toHaveBeenCalledWith('echo_session_token', mockToken)
      })
    })

    describe('getCurrentSession', () => {
      it('should return session data when both values exist', () => {
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'echo_user_id') return mockUserId
          if (key === 'echo_session_token') return mockToken
          return null
        })

        const session = getCurrentSession()
        expect(session).toEqual({
          userId: mockUserId,
          sessionToken: mockToken
        })
      })

      it('should return null when user ID is missing', () => {
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'echo_user_id') return null
          if (key === 'echo_session_token') return mockToken
          return null
        })

        const session = getCurrentSession()
        expect(session).toBeNull()
      })

      it('should return null when session token is missing', () => {
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'echo_user_id') return mockUserId
          if (key === 'echo_session_token') return null
          return null
        })

        const session = getCurrentSession()
        expect(session).toBeNull()
      })
    })

    describe('clearSession', () => {
      it('should remove all session data from localStorage', () => {
        clearSession()
        
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('echo_user_id')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('echo_session_token')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('lattice_player_id')
      })
    })
  })
})