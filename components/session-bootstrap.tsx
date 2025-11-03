"use client"

import { useEffect } from 'react'
import { ensureAnonSessionAndInit } from '@/lib/auth'

export default function SessionBootstrap() {
  useEffect(() => {
    ensureAnonSessionAndInit().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[SessionBootstrap] failed to init session:', err)
    })
  }, [])

  return null
}
