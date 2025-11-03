/**
 * Health Check Endpoint
 * Provides system status for monitoring and deployment verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketEngine } from '@/lib/market-engine'
import { marketEventSystem } from '@/lib/market-events'
import EnhancedDatabaseService from '@/lib/enhanced-db'
import redis from '@/lib/redis'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks = {
    database: false,
    redis: false,
    marketEngine: false,
    eventSystem: false
  }
  
  const errors: string[] = []

  try {
    // Test database connection
    try {
      await EnhancedDatabaseService.getLatestMarketData(['AAPL'])
      checks.database = true
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test Redis connection
    try {
      if (redis.isReady()) {
        await redis.ping()
        checks.redis = true
      } else {
        checks.redis = false
        errors.push('Redis: Not connected')
      }
    } catch (error) {
      errors.push(`Redis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test market engine
    try {
      const marketState = marketEngine.getMarketState()
      if (marketState && typeof marketState.dramaScore === 'number') {
        checks.marketEngine = true
      } else {
        errors.push('Market Engine: Invalid state')
      }
    } catch (error) {
      errors.push(`Market Engine: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test event system
    try {
      const dramaScore = marketEventSystem.calculateDramaScore()
      if (typeof dramaScore === 'number' && dramaScore >= 0) {
        checks.eventSystem = true
      } else {
        errors.push('Event System: Invalid drama score')
      }
    } catch (error) {
      errors.push(`Event System: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const responseTime = Date.now() - startTime
    const allHealthy = Object.values(checks).every(check => check)

    const response = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      errors: errors.length > 0 ? errors : undefined,
      marketState: checks.marketEngine ? marketEngine.getMarketState() : undefined,
      activeEvents: checks.eventSystem ? marketEventSystem.getActiveEvents().length : undefined
    }

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks
    }, {
      status: 500
    })
  }
}