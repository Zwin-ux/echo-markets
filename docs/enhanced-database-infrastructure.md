# Enhanced Database Infrastructure

This document describes the enhanced database schema and infrastructure implemented for the Echo Markets Alpha Demo.

## Overview

The enhanced database infrastructure includes:

- **Extended Prisma Schema**: New tables for portfolios, quests, leaderboards, and market events
- **Redis Caching Layer**: High-performance caching for real-time data
- **Connection Pooling**: Optimized database connections with performance monitoring
- **Enhanced Database Service**: Unified service layer with caching integration

## New Database Schema

### Core Tables

#### Portfolios
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_date DATE NOT NULL,
  starting_cash DECIMAL(15,2) DEFAULT 10000,
  current_cash DECIMAL(15,2),
  total_value DECIMAL(15,2),
  day_change DECIMAL(15,2),
  day_change_percent DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Quests
```sql
CREATE TABLE quests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_value DECIMAL(15,2),
  current_progress DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  reward_type VARCHAR(50),
  reward_value DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

#### Leaderboard Entries
```sql
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  score DECIMAL(15,2) NOT NULL,
  rank INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Market Events
```sql
CREATE TABLE market_events (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  affected_symbols TEXT[],
  impact_magnitude DECIMAL(5,2),
  sentiment VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enhanced Existing Tables

#### Users
- Added `username` field for public display
- Added `last_active` timestamp
- Added `preferences` JSON field for customization

#### Ticks (Market Data)
- Added bid/ask spread fields
- Added 24h change tracking
- Added volatility metrics
- Enhanced indexing for performance

## Redis Caching Strategy

### Cache Keys and TTL

| Data Type | Cache Key Pattern | TTL |
|-----------|------------------|-----|
| User Profile | `user:{userId}` | 5 minutes |
| Portfolio | `portfolio:{userId}:{date}` | 1 minute |
| Market Data | `market:{symbol}` or `market:all` | 30 seconds |
| Leaderboard | `leaderboard:{category}:{date}:{limit}` | 2 minutes |
| Quest Progress | `quests:{userId}` | 3 minutes |
| Market Events | `market_events:recent:{limit}` | 10 minutes |

### Cache Invalidation

The system automatically invalidates relevant cache entries when data is updated:

- User profile updates clear user cache
- Portfolio updates clear portfolio cache
- Market data updates clear market cache
- Leaderboard updates clear leaderboard cache

## Connection Pooling

### Configuration

Environment variables for connection optimization:

```env
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT=60000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_POOL_TIMEOUT=60000
```

### Features

- **Singleton Pattern**: Prevents connection pool exhaustion
- **Health Monitoring**: Built-in database health checks
- **Performance Metrics**: Connection pool monitoring
- **Graceful Shutdown**: Proper cleanup on process termination

## Enhanced Database Service

### Key Features

1. **Unified API**: Single service for all database operations
2. **Automatic Caching**: Redis integration with fallback to database
3. **Batch Operations**: Optimized bulk operations
4. **Cache Management**: Intelligent cache invalidation
5. **Performance Optimization**: Query result caching and optimization

### Usage Examples

```typescript
import EnhancedDatabaseService from '@/lib/enhanced-db'

// Get user with caching
const user = await EnhancedDatabaseService.getUserById(userId)

// Update portfolio with cache invalidation
await EnhancedDatabaseService.updatePortfolioValue(
  userId, 
  sessionDate, 
  totalValue, 
  dayChange
)

// Get leaderboard with caching
const leaderboard = await EnhancedDatabaseService.getLeaderboard(
  'daily_returns', 
  new Date(), 
  50
)

// Batch update portfolios
await EnhancedDatabaseService.batchUpdatePortfolios(updates)
```

## Performance Optimizations

### Database Level

1. **Indexing Strategy**:
   - Composite indexes on frequently queried columns
   - Partial indexes for filtered queries
   - Time-based indexes for historical data

2. **Query Optimization**:
   - Efficient joins with proper relationships
   - Pagination for large result sets
   - Aggregation at database level

3. **Connection Management**:
   - Connection pooling with configurable limits
   - Connection health monitoring
   - Automatic reconnection handling

### Application Level

1. **Caching Strategy**:
   - Multi-level caching (Redis + in-memory)
   - Intelligent cache invalidation
   - Cache warming for critical data

2. **Batch Operations**:
   - Bulk inserts and updates
   - Transaction optimization
   - Parallel processing where safe

## Monitoring and Health Checks

### Health Check Endpoint

`GET /api/health/database`

Returns comprehensive health status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "connectionPool": {
        "maxConnections": 10,
        "status": "healthy"
      }
    },
    "redis": {
      "status": "healthy",
      "enabled": true
    }
  }
}
```

### Metrics Available

- Database connection health
- Redis connection status
- Connection pool utilization
- Query performance metrics
- Cache hit/miss rates

## Migration and Deployment

### Running Migrations

```bash
# Generate and apply migration
npx prisma migrate dev --name enhanced-schema

# Generate Prisma client
npx prisma generate

# Run enhanced database migration script
npm run db:migrate-enhanced

# Test enhanced database functionality
npm run test:enhanced-db
```

### Environment Setup

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
ENABLE_REDIS_CACHE=true

# Performance
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT=60000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_POOL_TIMEOUT=60000
```

## Security Considerations

1. **Connection Security**:
   - SSL/TLS encryption for database connections
   - Redis AUTH when password is configured
   - Connection string security

2. **Data Protection**:
   - Input validation and sanitization
   - SQL injection prevention via Prisma
   - Sensitive data encryption

3. **Access Control**:
   - User-based data isolation
   - API rate limiting
   - Audit logging for sensitive operations

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**:
   - Check `DATABASE_CONNECTION_LIMIT`
   - Monitor connection usage
   - Ensure proper connection cleanup

2. **Redis Connection Issues**:
   - Verify Redis server is running
   - Check `REDIS_URL` configuration
   - Monitor Redis memory usage

3. **Migration Failures**:
   - Check database permissions
   - Verify schema compatibility
   - Review migration logs

### Debugging Tools

- Database health check endpoint
- Connection pool metrics
- Redis monitoring commands
- Prisma query logging

## Future Enhancements

1. **Read Replicas**: Separate read/write workloads
2. **Sharding**: Horizontal scaling for large datasets
3. **Advanced Caching**: Multi-tier caching strategies
4. **Real-time Subscriptions**: WebSocket-based data streaming
5. **Analytics**: Query performance analytics and optimization