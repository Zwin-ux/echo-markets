// Legacy Supabase client - DEPRECATED
// This file is kept for backward compatibility during migration
// Use lib/prisma.ts for new database operations

console.warn('[DEPRECATED] lib/supabase.ts is deprecated. Use lib/prisma.ts instead.')

// Stub implementation to prevent build errors
export const supabase = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
  }),
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
    signIn: () => ({ data: null, error: null }),
    signOut: () => ({ error: null }),
  }
}

export default supabase
