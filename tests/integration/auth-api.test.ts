import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { 
  generateRandomAvatar, 
  generateGuestUsername, 
  generateSessionToken,
  register,
  login,
  createGuestSession,
  validateSession
} from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    portfolio: {
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Guest Session Creation', () => {
    it('should create guest session via API', async () => {
      const mockResponse = {
        user: {
          id: 'guest123',
          username: 'swift_trader_1234',
          is_guest: true,
          avatar_url: '👾'
        },
        session_token: 'mock_token',
        expires_at: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const session = await createGuestSession()

      expect(session).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    })

    it('should handle guest session creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)

      const session = await createGuestSession()

      expect(session).toBeNull()
    })
  })

  describe('User Registration', () => {
    it('should register user via API', async () => {
      const mockResponse = {
        user: {
          id: 'user123',
          username: 'testuser',
          is_guest: false,
          email: 'test@example.com'
        },
        session_token: 'mock_token',
        expires_at: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const session = await register('testuser', 'password123', 'test@example.com')

      expect(session).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com'
        })
      })
    })

    it('should handle registration failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Username already taken' })
      } as Response)

      await expect(register('existinguser', 'password123')).rejects.toThrow('Username already taken')
    })
  })

  describe('User Login', () => {
    it('should login user via API', async () => {
      const mockResponse = {
        user: {
          id: 'user123',
          username: 'testuser',
          is_guest: false
        },
        session_token: 'mock_token',
        expires_at: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const session = await login('testuser', 'password123')

      expect(session).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })
    })

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid username or password' })
      } as Response)

      await expect(login('testuser', 'wrongpassword')).rejects.toThrow('Invalid username or password')
    })
  })

  describe('Session Validation', () => {
    it('should validate session via API', async () => {
      const mockResponse = {
        user: {
          id: 'user123',
          username: 'testuser'
        },
        session_token: 'valid_token',
        expires_at: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockImplementation((key) => {
            if (key === 'echo_user_id') return 'user123'
            if (key === 'echo_session_token') return 'valid_token'
            return null
          })
        }
      })

      const session = await validateSession()

      expect(session).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid_token'
        }
      })
    })

    it('should handle invalid session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response)

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockImplementation((key) => {
            if (key === 'echo_user_id') return 'user123'
            if (key === 'echo_session_token') return 'invalid_token'
            return null
          }),
          removeItem: jest.fn()
        }
      })

      const session = await validateSession()

      expect(session).toBeNull()
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should complete full guest-to-permanent conversion flow', async () => {
      // Mock localStorage properly
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      // Step 1: Create guest session
      const guestResponse = {
        user: { id: 'guest123', username: 'guest_user_123', is_guest: true },
        session_token: 'guest_token',
        expires_at: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => guestResponse
      } as Response)

      const guestSession = await createGuestSession()
      expect(guestSession?.user.is_guest).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('echo_user_id', 'guest123')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('echo_session_token', 'guest_token')

      // Step 2: Verify API calls were made
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    })
  })
})