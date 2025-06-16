'use client'

import * as React from 'react'
import type { Auth } from '@/types'
import { getAuthMethod } from '@/utils/env'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

const authMethod = getAuthMethod()
const isAuthEvmEnabled = authMethod === 'evm'

export type UseAuthEvmReturnType = ReturnType<typeof useAuthEvm>

export function useAuthEvm() {
  const { isConnected } = useAccount()
  const { openConnectModal, connectModalOpen } = useConnectModal()

  const [signatureRequired, setSignatureRequired] = React.useState(false)

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

  const authQuery = useQuery({
    queryKey: ['auth-evm', isConnected],
    queryFn: async () => {
      const res = await fetch('/api/auth/evm/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!res.ok) {
        return {
          address: null,
          role: null,
          status: 'unauthenticated' as any,
        }
      }

      const json = <
        | Auth
        | {
            address: null
            role: null
            status: 'unauthenticated'
          }
      >await res.json()

      return json
    },
    initialData: {
      address: null,
      role: null,
      status: 'unauthenticated',
    },
    enabled: isAuthEvmEnabled && isConnected,
    refetchOnWindowFocus: false,
    retry: false,
  })

  // Check if signature is required: connected but not authenticated
  React.useEffect(() => {
    if (
      isConnected &&
      authQuery.data.status === 'unauthenticated' &&
      !authQuery.isLoading
    ) {
      setSignatureRequired(true)
    } else if (authQuery.data.status === 'authenticated') {
      setSignatureRequired(false)
    }
  }, [isConnected, authQuery.data.status, authQuery.isLoading])

  // Reset signature required when disconnected
  React.useEffect(() => {
    if (!isConnected) {
      setSignatureRequired(false)
    }
  }, [isConnected])

  return {
    ...authQuery,
    signatureRequired,
    data: {
      ...authQuery.data,
      status:
        authQuery.isFetching || authQuery.isLoading || authQuery.isRefetching
          ? 'loading'
          : authQuery.data.status,
    },
  }
}
