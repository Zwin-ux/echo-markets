"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to beta page for now
    router.push('/beta')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          <span className="text-green-400">ECHO</span>
          <span className="text-pink-500">_</span>
          <span className="text-blue-400">MARKETS</span>
        </h1>
        <p className="text-green-300">Redirecting to beta...</p>
      </div>
    </div>
  )
}