import { createClient, RedisClientType } from 'redis'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnected = false

  constructor() {
    if (process.env.ENABLE_REDIS_CACHE === 'true') {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Redis Client Connected')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected')
        this.isConnected = false
      })
    }
  }

  async connect(): Promise<void> {
    if (this.client && !this.isConnected) {
      try {
        await this.client.connect()
      } catch (error) {
        console.error('Failed to connect to Redis:', error)
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect()
      } catch (error) {
        console.error('Failed to disconnect from Redis:', error)
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value)
      } else {
        await this.client.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      console.error('Redis HGET error:', error)
      return null
    }
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.hSet(key, field, value)
      return true
    } catch (error) {
      console.error('Redis HSET error:', error)
      return false
    }
  }

  async hGetAll(key: string): Promise<Record<string, string> | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      console.error('Redis HGETALL error:', error)
      return null
    }
  }

  async zadd(key: string, score: number, member: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.zAdd(key, { score, value: member })
      return true
    } catch (error) {
      console.error('Redis ZADD error:', error)
      return false
    }
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.zRange(key, start, stop, { REV: true })
    } catch (error) {
      console.error('Redis ZREVRANGE error:', error)
      return []
    }
  }

  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<Array<{ value: string; score: number }>> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.zRangeWithScores(key, start, stop, { REV: true })
    } catch (error) {
      console.error('Redis ZREVRANGE WITH SCORES error:', error)
      return []
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.expire(key, seconds)
      return true
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null
  }
}

// Create singleton instance
const redis = new RedisClient()

// Auto-connect if Redis is enabled
if (process.env.ENABLE_REDIS_CACHE === 'true') {
  redis.connect().catch(console.error)
}

export default redis