'use client'

import { useState } from 'react'
import { LayoutGrid, X } from 'lucide-react'
import { useModule } from '@/contexts/module-context'
import { MODULES } from '@/lib/modules'

export default function ModuleManager() {
  const { activeModules, toggleModule } = useModule()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close module manager' : 'Open module manager'}
        className="grid h-11 w-11 place-items-center rounded-full border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 pressable"
      >
        {isOpen ? <X size={18} /> : <LayoutGrid size={18} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 w-48 bg-black border border-green-500/30 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 text-xs font-semibold border-b border-green-500/30 bg-green-500/10">
            Modules
          </div>
          <div className="divide-y divide-green-500/10" role="menu" aria-label="Modules">
            {MODULES.map(module => (
              <div key={module.id} className="flex items-center justify-between p-2 hover:bg-green-500/5">
                <span className="text-sm">{module.name}</span>
                <button 
                  onClick={() => toggleModule(module.id)}
                  aria-pressed={activeModules.includes(module.id)}
                  tabIndex={0}
                  className={`relative h-7 w-12 rounded-full outline-none transition focus:ring-2 focus:ring-green-400 ${activeModules.includes(module.id) ? 'bg-green-500' : 'bg-gray-500'} active:scale-95`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${activeModules.includes(module.id) ? 'left-6' : 'left-1'}`}/>
                  <span className="sr-only">{activeModules.includes(module.id) ? 'Hide' : 'Show'} {module.name} module</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
