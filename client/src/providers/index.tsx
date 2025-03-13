'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { InverterProvider } from './inverter-provider'
import { ConnectorProvider } from './connector-provider'
import { AppProvider } from './app-context'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectorProvider>
        <InverterProvider>
          <AppProvider>
            {/* CHILDREN */}
            {children}
          </AppProvider>
        </InverterProvider>
        <Toaster
          closeButton
          richColors
          position="bottom-right"
          duration={5_000}
        />
      </ConnectorProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
