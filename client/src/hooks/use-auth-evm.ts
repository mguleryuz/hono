'use client'

import * as React from 'react'
import { getAuthMethod } from '@/utils/env'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import {
  getQueryKey,
  useEffectMutation,
  useEffectQuery,
} from './use-tanstack-effect'

const authMethod = getAuthMethod()
const isAuthEvmEnabled = authMethod === 'evm'

export type UseAuthEvmReturnType = ReturnType<typeof useAuthEvm>

export function useAuthEvm() {
  const queryClient = useQueryClient()
  const { isConnected } = useAccount()
  const { openConnectModal, connectModalOpen } = useConnectModal()

  const [signatureRequired, setSignatureRequired] = React.useState(false)

  // Check current session - needs credentials
  const {
    data: sessionData,
    isLoading,
    error,
    refetch,
  } = useEffectQuery(
    'auth-evm',
    'session',
    {},
    {
      includeCredentials: true,
      retry: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
      enabled: isAuthEvmEnabled && isConnected,
    }
  )

  // Get nonce mutation - needs credentials for session
  const getNonceMutation = useEffectMutation('auth-evm', 'nonce', {
    includeCredentials: true,
    onError: (error: Error) => {
      console.error('Get nonce error:', error)
    },
  })

  // Verify signature mutation - needs credentials for session
  const verifyMutation = useEffectMutation('auth-evm', 'verify', {
    includeCredentials: true,
    onSuccess: () => {
      // Invalidate and refetch the session query
      const sessionKey = getQueryKey('auth-evm', 'session', {}, true)
      queryClient.invalidateQueries({ queryKey: sessionKey })
      queryClient.refetchQueries({ queryKey: sessionKey })
      setSignatureRequired(false)
    },
    onError: (error: Error) => {
      console.error('Verify signature error:', error)
    },
  })

  // Sign out mutation - needs credentials for session
  const signOutMutation = useEffectMutation('auth-evm', 'signout', {
    includeCredentials: true,
    onSuccess: () => {
      // Clear the session cache
      const sessionKey = getQueryKey('auth-evm', 'session', {}, true)
      queryClient.setQueryData(sessionKey, null)
      queryClient.invalidateQueries({ queryKey: sessionKey })
      setSignatureRequired(false)
    },
    onError: (error: Error) => {
      console.error('Sign out error:', error)
    },
  })

  // Determine authentication status
  const user = error ? null : sessionData
  const isAuthenticated = !!user && user.status === 'authenticated'

  // Check if signature is required: connected but not authenticated
  React.useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading && !error) {
      setSignatureRequired(true)
    } else if (isAuthenticated) {
      setSignatureRequired(false)
    }
  }, [isConnected, isAuthenticated, isLoading, error])

  // Reset signature required when disconnected
  React.useEffect(() => {
    if (!isConnected) {
      setSignatureRequired(false)
    }
  }, [isConnected])

  // Open connect modal when signature is required
  React.useEffect(() => {
    if (
      isConnected &&
      signatureRequired &&
      openConnectModal &&
      !connectModalOpen
    ) {
      openConnectModal?.()
    }
  }, [isConnected, signatureRequired, openConnectModal, connectModalOpen])

  return {
    user,
    isLoading,
    error: error?.message || null,
    signatureRequired,
    getNonce: getNonceMutation.mutateAsync,
    getNonceLoading: getNonceMutation.isPending,
    getNonceError: getNonceMutation.error?.message || null,
    verify: verifyMutation.mutateAsync,
    verifyLoading: verifyMutation.isPending,
    verifyError: verifyMutation.error?.message || null,
    signOut: signOutMutation.mutateAsync,
    signOutLoading: signOutMutation.isPending,
    signOutError: signOutMutation.error?.message || null,
    refetch,
    data: {
      ...user,
      status:
        isLoading || getNonceMutation.isPending || verifyMutation.isPending
          ? 'loading'
          : isAuthenticated
            ? 'authenticated'
            : 'unauthenticated',
    },
  }
}
