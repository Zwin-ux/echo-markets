# Echo Markets - Beta Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- [Vercel Account](https://vercel.com)
- [Neon Database](https://neon.tech) (PostgreSQL)
- [Upstash Redis](https://upstash.com) (optional but recommended)

### 1. Database Setup (Neon)

1. Create a new Neon project at [neon.tech](https://neon.tech)
2. Copy your connection string
3. Run database migrations:
   ```bash
   npm run db:deploy
   ```

### 2. Redis Setup (Upstash - Optional)

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy your Redis URL
3. This enables caching for better performance

### 3. Deploy to Vercel

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/echo-markets)

#### Option B: Manual Deploy

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### 4. Environment Variables

Set these in your Vercel dashboard (Settings → Environment Variables):

```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require

# Redis (Optional - improves performance)
REDIS_URL=redis://user:pass@host:port
ENABLE_REDIS_CACHE=true

# Cron Jobs (Required for automated market updates)
CRON_SECRET=your-random-secret-key

# Performance Settings
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT=60000
DATABASE_QUERY_TIMEOUT=30000
ENABLE_REALTIME=true
```

### 5. Post-Deployment Setup

1. **Seed the database:**
   ```bash
   npm run db:seed
   ```

2. **Verify deployment:**
   - Visit `https://your-app.vercel.app/api/health`
   - Should return `{"status": "healthy"}`

3. **Test market engine:**
   - Visit `https://your-app.vercel.app/api/market/state`
   - Should return current market data

## 🎮 Beta Features

### Current Features
- ✅ **Virtual Trading**: Buy/sell stocks with $10,000 starting cash
- ✅ **Real-time Prices**: Dynamic price updates using Geometric Brownian Motion
- ✅ **Market Events**: AI-generated news affecting stock prices
- ✅ **Drama Score**: Real-time market excitement metric
- ✅ **Portfolio Tracking**: Performance analytics and holdings
- ✅ **Daily Sessions**: Fresh start each trading day
- ✅ **Leaderboards**: Compete with other traders

### Supported Stocks
- **AAPL** - Apple Inc.
- **MSFT** - Microsoft Corp.
- **TSLA** - Tesla Inc.
- **NVDA** - NVIDIA Corp.
- **AMZN** - Amazon.com Inc.
- **GOOGL** - Alphabet Inc.

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev

# Start enhanced market ticker (in another terminal)
npm run dev:enhanced-ticker
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## 📊 Monitoring

### Health Check
- **Endpoint**: `/api/health`
- **Purpose**: System status and component health
- **Response**: Database, Redis, Market Engine, Event System status

### Market State
- **Endpoint**: `/api/market/state`
- **Purpose**: Current market conditions and prices
- **Response**: Live prices, events, drama score

### Cron Jobs
- **Market Ticker**: Updates prices every 2 minutes
- **Market Events**: Generates events every 5 minutes  
- **Session Reset**: Resets daily sessions at 9 AM ET (weekdays)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check Neon database is active
   - Run `npm run db:deploy` to apply migrations

2. **Redis Connection Issues**
   - Redis is optional - app works without it
   - Verify `REDIS_URL` format: `redis://user:pass@host:port`
   - Set `ENABLE_REDIS_CACHE=false` to disable

3. **Cron Jobs Not Running**
   - Verify `CRON_SECRET` is set
   - Check Vercel Functions logs
   - Manually trigger: `POST /api/cron/market-ticker`

4. **Market Data Not Updating**
   - Check `/api/health` for market engine status
   - Verify cron jobs are running
   - Manually trigger price updates: `POST /api/market/state`

## 🚀 Performance Tips

1. **Enable Redis**: Significantly improves response times
2. **Database Indexing**: Already optimized for common queries
3. **Connection Pooling**: Configured for Vercel's serverless environment
4. **Caching Strategy**: Market data cached for 30 seconds, user data for 1 minute

## 📈 Scaling Considerations

- **Database**: Neon scales automatically
- **Redis**: Upstash handles scaling
- **Vercel**: Serverless functions scale automatically
- **WebSockets**: Consider upgrading to dedicated WebSocket service for >1000 concurrent users

## 🔐 Security

- Environment variables are encrypted
- Database connections use SSL
- API endpoints have rate limiting
- Cron jobs require secret authentication
- No sensitive data in client-side code

---

## 🎯 Beta Testing Goals

1. **User Experience**: Intuitive trading interface
2. **Performance**: Sub-second response times
3. **Reliability**: 99.9% uptime during market hours
4. **Engagement**: Average session > 10 minutes
5. **Scalability**: Support 100+ concurrent users

Ready to deploy? Let's get Echo Markets live! 🚀