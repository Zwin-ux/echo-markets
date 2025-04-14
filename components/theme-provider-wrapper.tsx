'use client'

import { ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="midnight"
      themes={['midnight', 'daylight', 'neo']}
    >
      {children}
    </ThemeProvider>
  )
}
