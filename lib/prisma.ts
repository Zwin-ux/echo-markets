// Re-export the optimized Prisma client with connection pooling
export { default as prisma, checkDatabaseHealth, getConnectionPoolMetrics, closeDatabaseConnection, DatabasePerformanceOptimizer } from './db-pool'
export { default } from './db-pool'