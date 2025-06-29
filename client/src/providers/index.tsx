'use client'

import React, { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AppProvider } from './app-context'
import { ConnectorProvider } from './connector-provider'
import { RainbowProvider } from './rainbow-provider'
import { ThemeProvider } from './theme-provider'

const isDev = process.env.NODE_ENV === 'development'

const ReactQueryDevtools = isDev
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : () => null

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ConnectorProvider>
          <RainbowProvider>
            <AppProvider>
              {/* CHILDREN */}
              {children}
            </AppProvider>
          </RainbowProvider>
        </ConnectorProvider>
        {isDev && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
      <Toaster
        closeButton
        richColors
        position="bottom-right"
        duration={5_000}
      />
    </ThemeProvider>
  )
}
