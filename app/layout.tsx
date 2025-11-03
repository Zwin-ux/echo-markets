import type { Metadata } from 'next'
import './globals.css'
import { UserStatsProvider } from '@/contexts/user-stats-context'
import { ModuleProvider } from '@/contexts/module-context'
import { PortfolioProvider } from '@/contexts/portfolio-context'
import { UserProvider } from '@/contexts/user-context'
import ModuleManager from '@/components/module-manager'
import SessionBootstrap from '@/components/session-bootstrap'
import RealtimeBridge from '@/components/realtime-bridge'
import { MarketPricesProvider } from '@/contexts/market-prices-context'
import { CommandProvider } from '@/contexts/command-context'

export const metadata: Metadata = {
  title: 'Lattice Trading',
  description: 'Virtual trading platform with real-time market simulation',
  icons: {
    icon: '/favicon.ico',
  }
}

import { GameEngineProvider } from '@/contexts/game-engine-context'
import ErrorBoundary from '@/components/error-boundary'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-black text-green-50">
      <body className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-b from-black to-green-900/5">
        <ErrorBoundary>
          <GameEngineProvider>
            <UserStatsProvider>
              <ModuleProvider>
                <PortfolioProvider>
                  <MarketPricesProvider>
                    <UserProvider>
                      <SessionBootstrap />
                      <RealtimeBridge />
                      <CommandProvider>
                        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                          {children}
                          <ModuleManager />
                        </main>
                      </CommandProvider>
                    </UserProvider>
                  </MarketPricesProvider>
                </PortfolioProvider>
              </ModuleProvider>
            </UserStatsProvider>
          </GameEngineProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
