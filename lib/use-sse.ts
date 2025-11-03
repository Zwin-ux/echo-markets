"use client"

import { useEffect, useRef, useState } from 'react'

export function useSSE<T = any>(url = '/api/stream') {
  const [lastEvent, setLastEvent] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(url)
    esRef.current = es
    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (ev) => {
      try { setLastEvent(JSON.parse(ev.data)) } catch { /* noop */ }
    }
    return () => { es.close(); esRef.current = null }
  }, [url])

  return { lastEvent, connected }
}

