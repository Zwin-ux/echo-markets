"use client"

import { useState } from 'react'
// Removed deprecated supabase import

export default function SignInBox() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send() {
    try {
      setErr(null)
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
      if (error) throw error
      setSent(true)
    } catch (e: any) {
      setErr(e?.message || 'Failed to send magic link')
    }
  }

  if (sent) {
    return <div className="text-sm bg-green-500/10 border border-green-500/30 p-3 rounded">Check your email for a magic link.</div>
  }

  return (
    <div className="space-y-2 w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full bg-black border border-green-500/30 rounded px-2 py-2 text-sm"
      />
      <button onClick={send} className="btn-hud w-full">Send Magic Link</button>
      {err && <div className="text-xs text-red-400">{err}</div>}
    </div>
  )
}

