'use client'

import { useState } from 'react'
import { LayoutGrid, X } from 'lucide-react'
import { useModule } from '@/contexts/module-context'

type Module = {
  id: string
  name: string
}

export default function ModuleManager() {
  const { activeModules, toggleModule } = useModule()
  const [isOpen, setIsOpen] = useState(false)

  const modules = [
    { id: 'trading', name: 'Trading' },
    { id: 'leaderboard', name: 'Leaderboard' },
    { id: 'portfolio', name: 'Portfolio' }
  ]

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-full border border-green-500/30"
      >
        {isOpen ? <X size={18} /> : <LayoutGrid size={18} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 w-48 bg-black border border-green-500/30 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 text-xs font-semibold border-b border-green-500/30 bg-green-500/10">
            Modules
          </div>
          <div className="divide-y divide-green-500/10">
            {modules.map(module => (
              <div key={module.id} className="flex items-center justify-between p-2 hover:bg-green-500/5">
                <span className="text-sm">{module.name}</span>
                <button 
                  onClick={() => toggleModule(module.id)}
                  className={`w-8 h-4 rounded-full relative ${activeModules.includes(module.id) ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${activeModules.includes(module.id) ? 'left-4' : 'left-0.5'}`}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
