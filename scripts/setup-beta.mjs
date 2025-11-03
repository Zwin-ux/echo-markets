#!/usr/bin/env node

/**
 * Echo Markets Beta Setup Script
 * Prepares the application for beta deployment
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createHash } from 'crypto'

console.log('🚀 Echo Markets Beta Setup\n')

// Check if .env.local exists
if (!existsSync('.env.local')) {
  console.log('⚠️  No .env.local found. Please copy .env.example to .env.local and configure your database.')
  console.log('   cp .env.example .env.local')
  console.log('   # Edit .env.local with your database credentials\n')
}

// Generate Prisma client
console.log('📦 Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated\n')
} catch (error) {
  console.error('❌ Failed to generate Prisma client')
  process.exit(1)
}

// Run database migrations
console.log('🗄️  Running database migrations...')
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  console.log('✅ Database migrations completed\n')
} catch (error) {
  console.error('❌ Database migrations failed')
  console.log('   Make sure your DATABASE_URL is correct in .env.local')
  process.exit(1)
}

// Seed database
console.log('🌱 Seeding database...')
try {
  execSync('npm run db:seed', { stdio: 'inherit' })
  console.log('✅ Database seeded\n')
} catch (error) {
  console.error('❌ Database seeding failed')
  console.log('   This is optional - the app will work without seed data')
}

// Run tests
console.log('🧪 Running unit tests...')
try {
  execSync('npm run test:unit', { stdio: 'inherit' })
  console.log('✅ All tests passed\n')
} catch (error) {
  console.error('❌ Some tests failed')
  console.log('   The app may still work, but check the test output above')
}

// Build the application
console.log('🏗️  Building application...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Application built successfully\n')
} catch (error) {
  console.error('❌ Build failed')
  process.exit(1)
}

// Generate a random cron secret if not exists
const envPath = '.env.local'
if (existsSync(envPath)) {
  let envContent = readFileSync(envPath, 'utf8')
  if (!envContent.includes('CRON_SECRET=')) {
    const cronSecret = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 32)
    envContent += `\n# Auto-generated cron secret\nCRON_SECRET=${cronSecret}\n`
    writeFileSync(envPath, envContent)
    console.log('🔐 Generated CRON_SECRET for automated jobs\n')
  }
}

console.log('🎉 Beta setup complete!\n')
console.log('Next steps:')
console.log('1. Start development server: npm run dev')
console.log('2. Start market ticker: npm run dev:enhanced-ticker')
console.log('3. Visit http://localhost:3000/beta for the beta landing page')
console.log('4. Visit http://localhost:3000/api/health to check system status')
console.log('\nFor production deployment:')
console.log('1. Deploy to Vercel: vercel --prod')
console.log('2. Set environment variables in Vercel dashboard')
console.log('3. Run database migrations: npm run db:deploy')
console.log('\n🚀 Happy trading!')