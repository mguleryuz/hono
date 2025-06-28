'use client'

import { useEffect } from 'react'
import { useTheme } from '@c/hooks'

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * @description Theme provider component that initializes and manages theme state
 * @param {React.ReactNode} children - Child components
 * @returns {JSX.Element} Theme provider wrapper
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme()

  // Prevent flash of unstyled content by ensuring theme is applied
  useEffect(() => {
    // Force a re-apply on mount to ensure theme is set
    const root = document.documentElement
    const stored = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | 'system'
      | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'
    const resolvedTheme = stored === 'system' || !stored ? systemTheme : stored

    // Apply immediately to prevent flash
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme === 'dark' ? 'dark' : 'light')
  }, [])

  return <>{children}</>
}
