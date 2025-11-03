import { NextResponse } from 'next/server'
import { checkDatabaseHealth, getConnectionPoolMetrics } from '@/lib/db-pool'
import redis from '@/lib/redis'

export async function GET() {
  try {
    // Check database health
    const dbHealthy = await checkDatabaseHealth()
    
    // Check Redis health
    const redisHealthy = redis.isReady()
    
    // Get connection pool metrics
    const poolMetrics = await getConnectionPoolMetrics()
    
    const healthStatus = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connectionPool: poolMetrics
        },
        redis: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
          enabled: process.env.ENABLE_REDIS_CACHE === 'true'
        }
      }
    }
    
    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'healthy' ? 200 : 503
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: { status: 'error' },
        redis: { status: 'error' }
      }
    }, { status: 503 })
  }
}