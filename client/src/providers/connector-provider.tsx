'use client'

// Third-party dependencies
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import type { HttpTransport } from 'viem'
import { WagmiProvider } from 'wagmi'

import { chains, getDrpcTransport } from '@/utils'

/**
 * Creates Wagmi configuration with specified chains and transport settings
 */
const config = getDefaultConfig({
  chains,
  projectId: '<project_name>',
  appName: '<project_name>',
  multiInjectedProviderDiscovery: false,
  transports: chains.reduce(
    (acc, chain) => {
      acc[chain.id] = getDrpcTransport(chain.id)
      return acc
    },
    {} as Record<number, HttpTransport>
  ),
  cacheTime: 5000, // 5 seconds
})

// ----------------------------------------------------------------------------
// Main Component

export function ConnectorProvider({ children }: { children: React.ReactNode }) {
  // Render provider hierarchy
  return (
    <WagmiProvider config={config} reconnectOnMount>
      {children}
    </WagmiProvider>
  )
}
