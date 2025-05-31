// Shared module list for Sidebar and ModuleManager
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
  List, // Add List icon
} from "lucide-react"

export type ModuleDef = {
  id: string
  name: string
  icon: React.ComponentType<{ size: number; className?: string }>
}

export const MODULES: ModuleDef[] = [
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
  { id: "stocklist", name: "Stock List", icon: List },
]
