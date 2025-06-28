import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

/**
 * @description Hook for managing application theme with system preference support
 * @returns {object} Theme state and control functions
 * @example
 * const { theme, setTheme, resolvedTheme } = useTheme()
 * setTheme('dark') // Set to dark theme
 * setTheme('system') // Follow system preference
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored
    }
    return 'system' // Default to system
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Detect system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    const resolved = theme === 'system' ? getSystemTheme() : theme

    // Remove both classes first
    root.classList.remove('light', 'dark')
    // Add the resolved theme
    root.classList.add(resolved)

    setResolvedTheme(resolved)
  }

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      applyTheme('system')
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Legacy browsers
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [theme])

  return {
    theme,
    setTheme,
    resolvedTheme,
  }
}
