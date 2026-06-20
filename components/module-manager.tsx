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
        className="grid h-11 w-11 place-items-center rounded-[3px] border border-[#334155] bg-[#111820] text-[#dce3ea] hover:bg-[#1b2735] pressable"
      >
        {isOpen ? <X size={18} /> : <LayoutGrid size={18} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 w-48 overflow-hidden rounded-[3px] border border-[#334155] bg-[#111820] shadow-none">
          <div className="border-b border-[#334155] bg-[#151e29] p-2 text-xs font-semibold text-[#dce3ea]">
            Modules
          </div>
          <div className="divide-y divide-[#202938]" role="menu" aria-label="Modules">
            {MODULES.map(module => (
              <div key={module.id} className="flex items-center justify-between p-2 text-[#dce3ea] hover:bg-[#151e29]">
                <span className="text-sm">{module.name}</span>
                <button 
                  onClick={() => toggleModule(module.id)}
                  aria-pressed={activeModules.includes(module.id)}
                  tabIndex={0}
                  className={`relative h-7 w-12 rounded-[3px] outline-none transition focus:ring-2 focus:ring-[#4f8cff] ${activeModules.includes(module.id) ? 'bg-[#2f6fed]' : 'bg-[#334155]'}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-[2px] bg-white transition-all ${activeModules.includes(module.id) ? 'left-6' : 'left-1'}`}/>
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
