"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ModuleContextType = {
  activeModules: string[]
  toggleModule: (moduleId: string) => void
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [activeModules, setActiveModules] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeModules')
      return saved ? JSON.parse(saved) : ['terminal', 'trading', 'portfolio']
    }
    return ['terminal', 'trading', 'portfolio']
  })

  const toggleModule = (moduleId: string) => {
    setActiveModules((prev) => {
      const newModules = prev.includes(moduleId) 
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeModules', JSON.stringify(newModules))
      }
      return newModules
    })
  }

  return <ModuleContext.Provider value={{ activeModules, toggleModule }}>{children}</ModuleContext.Provider>
}

export function useModule() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error("useModule must be used within a ModuleProvider")
  }
  return context
}
