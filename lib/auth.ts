import supabase from './supabase'

/**
 * Ensures there is an authenticated session (anonymous to start) and
 * initializes user data (profiles, portfolio) via RPC.
 */
export async function ensureAnonSessionAndInit() {
  const { data: sessionData } = await supabase.auth.getSession()
  let session = sessionData.session

  if (!session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
    if (signInError) {
      // eslint-disable-next-line no-console
      console.warn('[auth] Anonymous sign-in disabled or failed; continuing without session')
    } else {
      session = signInData.session ?? null
    }
  }

  if (session) {
    // Call init_user to ensure profile + portfolio exist
    const { error: initError } = await supabase.rpc('init_user')
    if (initError) {
      // eslint-disable-next-line no-console
      console.warn('[auth] init_user RPC failed (may already exist):', initError.message)
    }
  }

  return session
}
