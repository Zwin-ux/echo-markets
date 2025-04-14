"use client"

import { useState } from "react"
import { useModule } from "@/contexts/module-context"
import {
  BarChart3,
  TerminalIcon,
  MessageSquare,
  Globe,
  BookOpen,
  Settings,
  HelpCircle,
  Bookmark,
  Briefcase,
  Newspaper,
  TrendingUp,
  Trophy,
  Users,
  Bell,
} from "lucide-react"

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const { activeModules, toggleModule } = useModule()

  const modules = [
    { id: "terminal", name: "Terminal", icon: TerminalIcon },
    { id: "charts", name: "Charts", icon: BarChart3 },
    { id: "news", name: "News Feed", icon: Newspaper },
    { id: "portfolio", name: "Portfolio", icon: Briefcase },
    { id: "trading", name: "Trading", icon: TrendingUp },
    { id: "leaderboard", name: "Leaderboard", icon: Trophy },
    { id: "narrator", name: "Narrator", icon: MessageSquare },
    { id: "simulation", name: "Simulation", icon: Globe },
    { id: "education", name: "Learn", icon: BookOpen },
    { id: "bookmarks", name: "Bookmarks", icon: Bookmark },
    { id: "social", name: "Social", icon: Users },
    { id: "alerts", name: "Alerts", icon: Bell },
  ]

  return (
    <div className={`${expanded ? "w-48" : "w-12"} border-r border-green-500/30 bg-black transition-all duration-200`}>
      <div className="p-2 border-b border-green-500/30 flex justify-between items-center">
        {expanded && <span className="text-xs font-semibold">MODULES</span>}
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-green-500/20 rounded">
          {expanded ? "«" : "»"}
        </button>
      </div>

      <div className="py-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => toggleModule(module.id)}
            className={`w-full text-left p-2 flex items-center ${
              activeModules.includes(module.id)
                ? "bg-green-500/20 text-green-400"
                : "text-green-500/70 hover:bg-green-500/10"
            }`}
          >
            <module.icon size={16} className="flex-shrink-0" />
            {expanded && <span className="ml-2 text-sm">{module.name}</span>}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 w-full border-t border-green-500/30">
        <button className="w-full text-left p-2 flex items-center text-green-500/70 hover:bg-green-500/10">
          <HelpCircle size={16} />
          {expanded && <span className="ml-2 text-sm">Help</span>}
        </button>
        <button className="w-full text-left p-2 flex items-center text-green-500/70 hover:bg-green-500/10">
          <Settings size={16} />
          {expanded && <span className="ml-2 text-sm">Settings</span>}
        </button>
      </div>
    </div>
  )
}
