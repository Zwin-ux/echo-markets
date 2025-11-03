"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to trading game
    router.push('/trade')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-cyan-400">
          LATTICE
        </h1>
        <p className="text-cyan-300">Loading trading platform...</p>
      </div>
    </div>
  )
}