"use client";

import { useState, useEffect } from "react";
import Terminal from "@/components/terminal";
import Sidebar from "@/components/sidebar";
import ChartModule from "@/components/chart-module";
import NarratorModule from "@/components/market-narrator";
import SimulationModule from "@/components/simulation-module";
import PortfolioModule from "@/components/portfolio-module";
import NewsFeedModule from "@/components/news-feed-module";
import TradingModule from "@/components/trading-module";
import LeaderboardModule from "@/components/leaderboard-module";
import StockListModule from '@/components/stock-list-module'; // Import the new module
import { CommandProvider } from "@/contexts/command-context";
import { ModuleProvider, useModule } from "@/contexts/module-context"; // ModuleProvider is here
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { UserProvider } from "@/contexts/user-context";
import { ThemeProvider } from "@/components/theme-provider";
import UserProfile from "@/components/user-profile";
// GameEngineProvider is in layout.tsx, so it's available globally

// Main Home component that sets up providers
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // For SSR or initial client render, can return null or a global loading spinner
    // Or return a simplified layout if needed before full hydration
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}> {/* enableSystem often false for specific app themes */}
      <UserProvider>
        <PortfolioProvider>
          <CommandProvider>
            <ModuleProvider> {/* ModuleProvider wraps PageContent where useModule is called */}
              <PageSetup />
            </ModuleProvider>
          </CommandProvider>
        </PortfolioProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

// PageSetup component to handle profile state, as it's part of the page structure
function PageSetup() {
  const [showProfile, setShowProfile] = useState(false);
  return <PageContent showProfile={showProfile} setShowProfile={setShowProfile} />;
}


// PageContent sub-component to correctly use useModule hook and render the main layout
function PageContent({ showProfile, setShowProfile }: { showProfile: boolean, setShowProfile: (show: boolean) => void }) {
  const { activeModules, defaultModules } = useModule();

  // Optional: Log active/default modules for debugging
  useEffect(() => {
    // console.log('Default modules in PageContent:', defaultModules);
    // console.log('Active modules in PageContent:', activeModules);
  }, [activeModules, defaultModules]);


  return (
    <main className="flex flex-col h-screen bg-black text-green-400 font-mono overflow-hidden">
      <header className="border-b border-green-500/30 p-2 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <h1 className="text-xl font-bold tracking-tighter mr-2">
            <span className="text-green-400">ECHO</span>
            <span className="text-pink-500">_</span>
            <span className="text-blue-400">MARKETS</span>
          </h1>
          <div className="text-xs text-green-500/70 hidden sm:block">v0.3.0_sim</div> {/* Version bump, hide on very small screens */}
        </div>
        <div className="flex space-x-2 text-xs">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="px-2 py-1 bg-blue-500/20 rounded-sm hover:bg-blue-500/30 text-blue-300 hover:text-blue-200"
            title="View User Profile"
          >
            PROFILE
          </button>
          {/* More header items can be added here */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar /> {/* Sidebar likely controls activeModules */}

        {/* Main content grid for modules */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-3 lg:grid-rows-2 gap-1 p-1 overflow-y-auto auto-rows-fr custom-scrollbar">
          {/* Render active modules. Ensure 'stocks' module key is known by Sidebar/ModuleManager */}
          {activeModules.includes('terminal') && <Terminal />}
          {activeModules.includes('charts') && <ChartModule />}
          {activeModules.includes('news') && <NewsFeedModule />}
          {activeModules.includes('portfolio') && <PortfolioModule />}
          {activeModules.includes('trading') && <TradingModule />}
          {activeModules.includes('leaderboard') && <LeaderboardModule />}
          {activeModules.includes('simulation') && <SimulationModule />}
          {activeModules.includes('stocks') && <StockListModule />} {/* Added StockListModule */}

          {/* Narrator module special handling for layout - spans more space if active */}
          {activeModules.includes('narrator') && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 lg:row-span-2 order-first lg:order-last"> {/* Example: full width, takes up 2 rows on large screens */}
              <NarratorModule />
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-green-500/30 p-1.5 text-xs text-green-500/70 flex justify-between items-center flex-shrink-0">
        <div>
          Press <kbd className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">?</kbd> for shortcuts
        </div>
        <div className="hidden sm:block">ECHO_MARKETS &copy; {new Date().getFullYear()} | Simulation Active</div>
      </footer>

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]"> {/* Ensure high z-index */}
          <UserProfile onClose={() => setShowProfile(false)} />
        </div>
      )}
    </main>
  );
}
