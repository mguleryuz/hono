'use client'

import { InverterProvider as InverterProviderCore } from '@inverter-network/react/client'

export function InverterProvider({ children }: { children: React.ReactNode }) {
  const sharedThemes = {
    background: 'var(--background)',
    foreground: 'var(--foreground)',

    primary: 'var(--primary)',
    'primary-foreground': 'var(--primary-foreground)',

    accent: 'var(--accent)',
    'accent-foreground': 'var(--accent-foreground)',

    destructive: 'var(--destructive)',
    'destructive-foreground': 'var(--destructive-foreground)',

    card: 'var(--card)',
    'card-foreground': 'var(--card-foreground)',
    popover: 'var(--popover)',
    'popover-foreground': 'var(--popover-foreground)',
    secondary: 'var(--secondary)',
    'secondary-foreground': 'var(--secondary-foreground)',
    muted: 'var(--muted)',
    'muted-foreground': 'var(--muted-foreground)',

    'chart-1': 'var(--chart-1)',
    'chart-2': 'var(--chart-2)',
    'chart-3': 'var(--chart-3)',
    'chart-4': 'var(--chart-4)',
    'chart-5': 'var(--chart-5)',
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',
  }
  return (
    <InverterProviderCore
      themeConfig={{
        theme: 'dark',
        baseTheme: {
          radius: 'var(--radius)',
        },
        darkTheme: sharedThemes,
        lightTheme: sharedThemes,
      }}
    >
      {children}
    </InverterProviderCore>
  )
}
