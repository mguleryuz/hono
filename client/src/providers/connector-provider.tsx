'use client'

// Third-party dependencies
import { chains, getERPCTransport } from '@/utils'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import type { HttpTransport } from 'viem'
import { WagmiProvider } from 'wagmi'

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
      acc[chain.id] = getERPCTransport(chain.id)
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
