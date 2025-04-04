'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ConnectorProvider } from './connector-provider'
import { AppProvider } from './app-context'
import { RainbowProvider } from './rainbow-provider'

const isDev = process.env.NODE_ENV === 'development'

// Conditional imports for dev tools
const DevTools = isDev
  ? {
      TanStackRouterDevtools: (await import('@tanstack/router-devtools'))
        .TanStackRouterDevtools,
      ReactQueryDevtools: (await import('@tanstack/react-query-devtools'))
        .ReactQueryDevtools,
    }
  : {
      TanStackRouterDevtools: () => null,
      ReactQueryDevtools: () => null,
    }

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ConnectorProvider>
          <RainbowProvider>
            <AppProvider>
              {/* CHILDREN */}
              {children}
            </AppProvider>
          </RainbowProvider>
        </ConnectorProvider>
        {isDev && <DevTools.TanStackRouterDevtools position="bottom-left" />}
        {isDev && <DevTools.ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
      <Toaster
        closeButton
        richColors
        position="bottom-right"
        duration={5_000}
      />
    </>
  )
}
