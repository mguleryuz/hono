'use client'

// Third-party dependencies
import {
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import { getAuthMethod } from '@/utils/env'
import { createSiweMessage } from 'viem/siwe'
import { useEvmAuth } from '@c/hooks'

import '@rainbow-me/rainbowkit/styles.css'

const authMethod = getAuthMethod()
const isEvmAuth = authMethod === 'evm'

// ============================================================================
// Main Component
// ============================================================================

export function RainbowProvider({ children }: { children: React.ReactNode }) {
  const auth = useEvmAuth()

  // Prepare the authentication adapter
  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const res = await fetch(`/api/auth/evm/nonce`, {
        method: 'GET',
        credentials: 'include',
      })
      return await res.text()
    },
    createMessage: ({ nonce, address, chainId }) =>
      createSiweMessage({
        domain: window.location.host,
        address,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        statement: 'EVM Sign in by <project_name>',
      }),
    verify: async ({ message, signature }) => {
      const verifyRes = await fetch('/api/auth/evm/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })

      const ok = Boolean(verifyRes.ok)

      if (ok) await auth.refetch()

      return ok
    },
    signOut: async () => {
      await fetch(`/api/auth/evm/signout`, {
        method: 'GET',
        credentials: 'include',
      })

      await auth.refetch()
    },
  })

  // Render provider hierarchy
  return (
    <RainbowKitAuthenticationProvider
      adapter={authenticationAdapter}
      status={auth.data.status ?? 'unauthenticated'}
      enabled={isEvmAuth}
    >
      <RainbowKitProvider
        avatar={() => (
          <img
            src="/images/icon.svg"
            alt="<project_name>"
            width={60}
            height={60}
          />
        )}
        // @ts-expect-error - TODO: fix this
        theme={{
          radii: {
            actionButton: 'var(--radius)',
            connectButton: 'var(--radius)',
            menuButton: 'var(--radius)',
            modal: 'var(--radius)',
            modalMobile: 'var(--radius)',
          },
          colors: {
            accentColor: 'hsl(var(--accent))',
            accentColorForeground: 'hsl(var(--accent-foreground))',
            actionButtonBorder: 'hsl(var(--border))',
            actionButtonBorderMobile: 'hsl(var(--border))',
            actionButtonSecondaryBackground: 'hsl(var(--muted))',
            closeButton: 'hsl(var(--muted-foreground))',
            closeButtonBackground: 'hsl(var(--muted))',
            connectButtonBackground: 'hsl(var(--primary))',
            connectButtonBackgroundError: 'hsl(var(--destructive))',
            connectButtonInnerBackground: 'hsl(var(--background))',
            connectButtonText: 'hsl(var(--primary-foreground))',
            connectButtonTextError: 'hsl(var(--destructive-foreground))',
            connectionIndicator: 'hsl(var(--secondary))',
            downloadBottomCardBackground: 'hsl(var(--card))',
            downloadTopCardBackground: 'hsl(var(--background))',
            error: 'hsl(var(--destructive))',
            generalBorder: 'hsl(var(--border))',
            generalBorderDim: 'hsl(var(--border))',
            menuItemBackground: 'hsl(var(--background))',
            modalBackdrop: 'hsl(var(--background))',
            modalBackground: 'hsl(var(--background))',
            modalBorder: 'hsl(var(--border))',
            modalText: 'hsl(var(--foreground))',
            modalTextDim: 'hsl(var(--muted-foreground))',
            modalTextSecondary: 'hsl(var(--muted-foreground))',
            profileAction: 'hsl(var(--muted))',
            profileActionHover: 'hsl(var(--muted-foreground))',
            profileForeground: 'hsl(var(--foreground))',
            selectedOptionBorder: 'hsl(var(--accent))',
            standby: 'hsl(var(--secondary))',
          },
        }}
      >
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  )
}
