# Echo Markets - Virtual Trading Platform Beta

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/echo-markets)

> **🚀 Beta Version**: Experience the future of virtual trading with realistic market simulation powered by advanced algorithms.

## ✨ Features

### 🎯 **Realistic Trading Experience**
- **$10,000 Virtual Cash**: Start with virtual capital, no real money at risk
- **Advanced Market Simulation**: Geometric Brownian Motion price modeling
- **Real-time Updates**: Live price feeds and instant trade execution
- **Market & Limit Orders**: Professional trading tools
- **Bid-Ask Spreads**: Realistic market microstructure

### 📈 **Dynamic Market Engine**
- **AI-Generated Events**: Earnings announcements, breaking news, sector rotations
- **Volatility Modeling**: Dynamic volatility based on market conditions
- **Drama Score**: Real-time market excitement metric (0-100)
- **Sector Correlations**: Stocks move together based on sector relationships
- **Circuit Breakers**: Realistic price limits and trading halts

### 🏆 **Competition & Gamification**
- **Daily Leaderboards**: Compete with other traders
- **Performance Analytics**: Track your trading metrics
- **Quest System**: Complete challenges for rewards
- **Social Feed**: See other traders' big moves
- **Achievement System**: Unlock badges and milestones

### 🔧 **Technical Excellence**
- **Next.js 15**: Modern React framework with App Router
- **PostgreSQL + Prisma**: Robust database with type safety
- **Redis Caching**: High-performance data layer
- **WebSocket Streaming**: Real-time market updates
- **Comprehensive Testing**: 60+ unit and integration tests

## 🚀 Quick Start

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/echo-markets)

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/echo-markets.git
cd echo-markets

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run setup script (handles database, migrations, seeding, tests, build)
npm run setup:beta

# Start development server
npm run dev

# Start enhanced market ticker (in another terminal)
npm run dev:enhanced-ticker
```

Visit:
- **Main App**: http://localhost:3000
- **Beta Landing**: http://localhost:3000/beta
- **Health Check**: http://localhost:3000/api/health

## 📊 Supported Stocks

| Symbol | Company | Sector |
|--------|---------|--------|
| **AAPL** | Apple Inc. | Technology |
| **MSFT** | Microsoft Corp. | Technology |
| **TSLA** | Tesla Inc. | Electric Vehicles |
| **NVDA** | NVIDIA Corp. | Semiconductors |
| **AMZN** | Amazon.com Inc. | E-commerce |
| **GOOGL** | Alphabet Inc. | Technology |

## 🎮 How to Play

1. **Sign In**: Use email magic link (no password required)
2. **Start Trading**: You get $10,000 virtual cash daily
3. **Buy/Sell Stocks**: Use market or limit orders
4. **Watch Events**: AI generates realistic market events
5. **Compete**: Climb the daily leaderboards
6. **Reset Daily**: Fresh start every trading day

## 🔧 Environment Setup

### Required Variables
```env
# Database (Required)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# Cron Jobs (Required for production)
CRON_SECRET="your-random-secret-key"
```

### Optional Variables
```env
# Redis (Improves performance)
REDIS_URL="redis://user:pass@host:port"
ENABLE_REDIS_CACHE=true

# Real-time Features
ENABLE_REALTIME=true
WEBSOCKET_URL="ws://localhost:8080"
```

## 📈 API Endpoints

### Market Data
- `GET /api/market/state` - Current market state and prices
- `GET /api/market/events` - Recent market events
- `GET /api/market/drama-score` - Real-time drama score

### Trading
- `POST /api/portfolio/execute-order` - Execute buy/sell orders
- `GET /api/portfolio/value` - Current portfolio value
- `GET /api/leaderboard` - Daily rankings

### System
- `GET /api/health` - System health check
- `POST /api/cron/market-ticker` - Manual price updates
- `POST /api/cron/market-events` - Manual event generation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Test specific component
npm test -- market-engine.test.ts
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - `DATABASE_URL` (Neon PostgreSQL)
   - `DIRECT_URL` (Neon PostgreSQL)
   - `CRON_SECRET` (Random string)
   - `REDIS_URL` (Upstash Redis - optional)

3. **Run Database Migrations**:
   ```bash
   npm run db:deploy
   ```

### Other Platforms

The app works on any platform supporting Node.js:
- **Railway**: Auto-deploy from GitHub
- **Render**: Static site + background services
- **DigitalOcean**: App Platform deployment
- **AWS**: Amplify or Elastic Beanstalk

## 📊 Performance

- **Response Time**: < 200ms average API response
- **Database**: Optimized queries with connection pooling
- **Caching**: Redis for frequently accessed data
- **Real-time**: WebSocket connections for live updates
- **Scalability**: Serverless architecture scales automatically

## 🔐 Security

- **Environment Variables**: All secrets encrypted
- **Database**: SSL connections required
- **API Rate Limiting**: Prevents abuse
- **Input Validation**: Zod schema validation
- **No Real Money**: Virtual trading only

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check your DATABASE_URL format
# Run migrations
npm run db:deploy
```

**Redis Connection Issues**
```bash
# Redis is optional - disable if needed
ENABLE_REDIS_CACHE=false
```

**Build Failures**
```bash
# Regenerate Prisma client
npm run db:generate
npm run build
```

**Market Data Not Updating**
```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Manually trigger updates
curl -X POST https://your-app.vercel.app/api/cron/market-ticker
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Prisma Team** - Excellent database toolkit
- **Vercel** - Seamless deployment platform
- **Neon** - Serverless PostgreSQL
- **Upstash** - Serverless Redis

---

## 🎯 Beta Testing Goals

We're looking for feedback on:

1. **User Experience**: Is the trading interface intuitive?
2. **Performance**: Are response times acceptable?
3. **Engagement**: How long do you stay engaged?
4. **Features**: What would you like to see added?
5. **Bugs**: Any issues or unexpected behavior?

**Feedback**: Open an issue or email us at feedback@echomarkets.dev

---

<div align="center">

**🚀 Ready to trade? [Start Now](https://your-app.vercel.app) 🚀**

*Built with ❤️ for the trading community*

</div>