import type { Metadata } from 'next'
import './globals.css'
import { UserStatsProvider } from '@/contexts/user-stats-context'
import { ModuleProvider } from '@/contexts/module-context'
import { PortfolioProvider } from '@/contexts/portfolio-context'
import { UserProvider } from '@/contexts/user-context'
import ModuleManager from '@/components/module-manager'

export const metadata: Metadata = {
  title: 'Echo Markets',
  description: 'Daily trading game experience'
}

import { GameEngineProvider } from '@/contexts/game-engine-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <GameEngineProvider>
      <UserStatsProvider>
        <ModuleProvider>
          <PortfolioProvider>
            <UserProvider>
              <html lang="en" className="bg-black text-green-50">
                <body className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-b from-black to-green-900/5">
                  <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                    <ModuleManager />
                  </main>
                </body>
              </html>
            </UserProvider>
          </PortfolioProvider>
        </ModuleProvider>
      </UserStatsProvider>
    </GameEngineProvider>
  )
}
