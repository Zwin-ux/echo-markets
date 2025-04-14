'use client'

import { useTheme } from '@/contexts/theme-context'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          {theme === 'midnight' && <Moon className="h-4 w-4" />}
          {theme === 'daylight' && <Sun className="h-4 w-4" />}
          {theme === 'neo' && <Monitor className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('midnight')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Midnight Trader</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('daylight')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Daylight Clarity</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('neo')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Neo Terminal</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
