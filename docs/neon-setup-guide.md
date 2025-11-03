# Neon Database Setup Guide

## Step 1: Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub or email
3. Create a new project called "echo-markets"

## Step 2: Get Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (it looks like this):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Step 3: Update Environment Variables
Replace the placeholder values in your `.env` file:

```env
DATABASE_URL="postgresql://your-username:your-password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://your-username:your-password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Step 4: Run Database Migration
Once you have your Neon database URL configured:

```bash
# Generate Prisma client
npx prisma generate

# Run the migration to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Step 5: Test the Connection
```bash
# Build the project to test everything works
npm run build
```

## Neon Features You Get:
- **Generous Free Tier**: 512 MB storage, 1 compute unit
- **Branching**: Create database branches for development
- **Auto-scaling**: Scales to zero when not in use
- **Connection Pooling**: Built-in connection pooling
- **Backups**: Automatic daily backups

## Next Steps After Setup:
1. Update background scripts to use Prisma
2. Implement WebSocket server for real-time features
3. Test all functionality
4. Deploy to production

## Troubleshooting:
- **Connection errors**: Check your DATABASE_URL format
- **SSL errors**: Ensure `?sslmode=require` is in your connection string
- **Migration errors**: Make sure database is empty before first migration