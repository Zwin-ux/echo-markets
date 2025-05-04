"use client"

import { useState } from "react"
import { useModule } from "@/contexts/module-context"
import { MODULES, ModuleDef } from "@/lib/modules"
import {
  Settings,
  HelpCircle
} from "lucide-react"

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const { activeModules, toggleModule } = useModule()

  // Import the shared module list
  import { MODULES } from "@/lib/modules";

  return (
    <div className={`${expanded ? "w-48" : "w-12"} border-r border-green-500/30 bg-black transition-all duration-200`}>
      <div className="p-2 border-b border-green-500/30 flex justify-between items-center">
        {expanded && <span className="text-xs font-semibold">MODULES</span>}
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-green-500/20 rounded">
          {expanded ? "«" : "»"}
        </button>
      </div>

      <div className="py-2 overflow-y-auto max-h-[calc(100vh-8rem)]" role="menu" aria-label="Modules">
        {MODULES.map((module) => (
          <button
            key={module.id}
            onClick={() => toggleModule(module.id)}
            aria-pressed={activeModules.includes(module.id)}
            tabIndex={0}
            className={`w-full text-left p-2 flex items-center transition-colors duration-100 outline-none focus:ring-2 focus:ring-green-400 ${
              activeModules.includes(module.id)
                ? "bg-green-500/20 text-green-400"
                : "text-green-500/70 hover:bg-green-500/10"
            }`}
          >
            <module.icon size={16} className="flex-shrink-0" aria-hidden="true" />
            {expanded && <span className="ml-2 text-sm">{module.name}</span>}
            <span className="sr-only">{activeModules.includes(module.id) ? 'Hide' : 'Show'} {module.name} module</span>
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
