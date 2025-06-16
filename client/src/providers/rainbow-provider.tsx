'use client'

// Third-party dependencies
import { getAuthMethod } from '@/utils/env'
import { useAuthEvm } from '@c/hooks'
import {
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import { createSiweMessage } from 'viem/siwe'

import '@rainbow-me/rainbowkit/styles.css'

const authMethod = getAuthMethod()
const isEvmAuth = authMethod === 'evm'

// ============================================================================
// Main Component
// ============================================================================

export function RainbowProvider({ children }: { children: React.ReactNode }) {
  // Use consolidated auth hook with auto-prompt enabled globally
  const auth = useAuthEvm()

  // Prepare the authentication adapter
  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      try {
        const res = await fetch(`/api/auth/evm/nonce`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error('Failed to get nonce')
        }

        return await res.text()
      } catch (error) {
        console.error('Error getting nonce:', error)
        throw error
      }
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
      try {
        const verifyRes = await fetch('/api/auth/evm/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, signature }),
          credentials: 'include',
        })

        const ok = Boolean(verifyRes.ok)

        if (ok) {
          // Refetch auth state after successful verification
          await auth.refetch()
        }

        return ok
      } catch (error) {
        console.error('Error verifying message:', error)
        return false
      }
    },
    signOut: async () => {
      try {
        await fetch(`/api/auth/evm/signout`, {
          method: 'GET',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Error signing out:', error)
      } finally {
        // Always refetch to update local state after signout
        await auth.refetch()
      }
    },
  })

  // Render provider hierarchy
  return (
    <RainbowKitAuthenticationProvider
      adapter={authenticationAdapter}
      status={auth.data.status}
      enabled={isEvmAuth}
    >
      <RainbowKitProvider
        showRecentTransactions={true}
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
            accentColor: 'var(--primary)',
            accentColorForeground: 'var(--primary-foreground)',
            actionButtonBorder: 'var(--border)',
            actionButtonBorderMobile: 'var(--border)',
            actionButtonSecondaryBackground: 'var(--muted)',
            closeButton: 'var(--secondary-foreground)',
            closeButtonBackground: 'var(--secondary)',
            connectButtonBackground: 'var(--primary)',
            connectButtonBackgroundError: 'var(--destructive)',
            connectButtonInnerBackground: 'var(--background)',
            connectButtonText: 'var(--primary-foreground)',
            connectButtonTextError: 'var(--destructive-foreground)',
            connectionIndicator: 'var(--secondary)',
            downloadBottomCardBackground: 'var(--card)',
            downloadTopCardBackground: 'var(--background)',
            error: 'var(--destructive)',
            generalBorder: 'var(--border)',
            generalBorderDim: 'var(--border)',
            menuItemBackground: 'var(--background)',
            modalBackdrop: 'var(--background)',
            modalBackground: 'var(--background)',
            modalBorder: 'var(--border)',
            modalText: 'var(--foreground)',
            modalTextDim: 'var(--muted)',
            modalTextSecondary: 'var(--muted)',
            profileAction: 'var(--secondary)',
            profileActionHover: 'var(--secondary-hover)',
            profileForeground: 'var(--background)',
            selectedOptionBorder: 'var(--border)',
            standby: 'var(--secondary)',
          },
        }}
      >
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  )
}
