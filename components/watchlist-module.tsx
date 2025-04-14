'use client'

import { useState } from 'react'
import { usePortfolio } from '@/contexts/portfolio-context'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'

type SortField = 'symbol' | 'price' | 'change'
type SortDirection = 'asc' | 'desc'

export function WatchlistModule() {
  const { portfolio } = usePortfolio()
  const [sortConfig, setSortConfig] = useState<{
    field: SortField
    direction: SortDirection
  }>({ field: 'symbol', direction: 'asc' })

  const sortedWatchlist = [...portfolio.watchlist].sort((a, b) => {
    if (a[sortConfig.field] < b[sortConfig.field]) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (a[sortConfig.field] > b[sortConfig.field]) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  const requestSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 font-medium text-sm">
        <div 
          className="col-span-5 flex items-center cursor-pointer"
          onClick={() => requestSort('symbol')}
        >
          Symbol {sortConfig.field === 'symbol' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </div>
        <div 
          className="col-span-3 flex items-center justify-end cursor-pointer"
          onClick={() => requestSort('price')}
        >
          Price {sortConfig.field === 'price' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </div>
        <div 
          className="col-span-4 flex items-center justify-end cursor-pointer"
          onClick={() => requestSort('change')}
        >
          Change {sortConfig.field === 'change' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </div>
      </div>

      {sortedWatchlist.map(item => (
        <div key={item.symbol} className="grid grid-cols-12 gap-2 text-sm">
          <div className="col-span-5 font-medium">{item.symbol}</div>
          <div className="col-span-3 text-right">${item.price.toFixed(2)}</div>
          <div className={`col-span-4 text-right ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  )
}
