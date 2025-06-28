'use client'

import { Button } from '@c/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@c/components/ui/dropdown-menu'
import { useTheme } from '@c/hooks'
import { cn } from '@c/utils'
import { Monitor, Moon, Sun } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface ThemeSwitcherProps {
  className?: string
  variant?: 'icon' | 'full'
}

/**
 * @description Theme switcher component with dropdown menu
 * @param {string} className - Additional CSS classes
 * @param {'icon' | 'full'} variant - Display variant
 * @returns {JSX.Element} Theme switcher component
 * @example
 * <ThemeSwitcher />
 * <ThemeSwitcher variant="full" />
 */
export function ThemeSwitcher({
  className,
  variant = 'icon',
}: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find((t) => t.value === theme) || themes[2]
  const CurrentIcon = currentTheme.icon

  if (variant === 'full') {
    return (
      <Tabs
        responsive
        onValueChange={(value) =>
          setTheme(value as 'light' | 'dark' | 'system')
        }
        defaultValue={theme}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="light">
            <Sun className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="dark">
            <Moon className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="system">
            <Monitor className="size-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'flex size-9 items-center justify-center bg-gradient-to-r from-[hsl(165,82%,51%)]/10 to-[hsl(280,68%,60%)]/10 hover:from-[hsl(165,82%,51%)]/15 hover:to-[hsl(280,68%,60%)]/15',
            className
          )}
        >
          <CurrentIcon className="size-4 transition-transform hover:rotate-12" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {themes.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.value
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'flex items-center gap-2',
                isActive && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="size-4" />
              <span>{t.label}</span>
              {isActive && (
                <span className="text-muted-foreground ml-auto text-xs">
                  {t.value === 'system' ? `(${resolvedTheme})` : '✓'}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
