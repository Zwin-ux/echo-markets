// Legacy Supabase server client - DEPRECATED
// This file is kept for backward compatibility during migration
// Use lib/prisma.ts for new database operations

import type { NextRequest } from 'next/server'
import prisma from './prisma'

console.warn('[DEPRECATED] lib/supabase-server.ts is deprecated. Use lib/prisma.ts instead.')

// Stub implementation to prevent build errors
const stubClient = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
  }),
}

export function getSupabaseForRequest(req: NextRequest) {
  return stubClient
}

export function getSupabaseService() {
  return stubClient
}

