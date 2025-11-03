import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Connection pool configuration
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  
  // Connection timeout in milliseconds
  connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '60000'),
  
  // Query timeout in milliseconds
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
  
  // Pool timeout in milliseconds
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '60000'),
}

// Create Prisma client with optimized configuration
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

// Singleton pattern for Prisma client to prevent connection pool exhaustion
const prisma = globalThis.__prisma || createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Connection pool metrics
export async function getConnectionPoolMetrics() {
  try {
    // Note: Prisma doesn't expose pool metrics directly
    // This is a placeholder for monitoring implementation
    return {
      activeConnections: 'N/A',
      idleConnections: 'N/A',
      totalConnections: 'N/A',
      maxConnections: connectionPoolConfig.connectionLimit,
      status: await checkDatabaseHealth() ? 'healthy' : 'unhealthy'
    }
  } catch (error) {
    console.error('Failed to get connection pool metrics:', error)
    return {
      activeConnections: 'Error',
      idleConnections: 'Error',
      totalConnections: 'Error',
      maxConnections: connectionPoolConfig.connectionLimit,
      status: 'error'
    }
  }
}

// Graceful shutdown handler
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('Database connection closed gracefully')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Performance optimization utilities
export class DatabasePerformanceOptimizer {
  private static queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>()
  
  // Simple query result caching
  static async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlMs: number = 60000 // 1 minute default
  ): Promise<T> {
    const cached = this.queryCache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.result
    }
    
    const result = await queryFn()
    this.queryCache.set(key, { result, timestamp: now, ttl: ttlMs })
    
    // Clean up expired entries periodically
    if (this.queryCache.size > 1000) {
      this.cleanupExpiredCache()
    }
    
    return result
  }
  
  private static cleanupExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if ((now - value.timestamp) > value.ttl) {
        this.queryCache.delete(key)
      }
    }
  }
  
  // Clear cache manually
  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }
  
  // Batch operations helper
  static async batchOperation<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await operation(batch)
      results.push(...batchResults)
    }
    
    return results
  }
}

// Process cleanup handlers
process.on('beforeExit', closeDatabaseConnection)
process.on('SIGINT', closeDatabaseConnection)
process.on('SIGTERM', closeDatabaseConnection)

export default prisma
export { connectionPoolConfig }