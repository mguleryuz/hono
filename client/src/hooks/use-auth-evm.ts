'use client'

import * as React from 'react'
import { getAuthMethod } from '@/utils/env'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

import { useEffectQuery } from './use-tanstack-effect'

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

  const sessionQuery = useEffectQuery(
    'auth-evm',
    'session',
    {},
    {
      initialData: {
        mongo_id: '',
        address: '',
        role: 'USER',
        status: 'unauthenticated',
      },
      includeCredentials: true,
      retry: false,
      refetchOnWindowFocus: false,
      enabled: isAuthEvmEnabled && isConnected,
    }
  )

  // Check if signature is required: connected but not authenticated
  React.useEffect(() => {
    if (
      isConnected &&
      sessionQuery.data.status === 'unauthenticated' &&
      !sessionQuery.isLoading
    ) {
      setSignatureRequired(true)
    } else if (sessionQuery.data.status === 'authenticated') {
      setSignatureRequired(false)
    }
  }, [isConnected, sessionQuery.data.status, sessionQuery.isLoading])

  // Reset signature required when disconnected
  React.useEffect(() => {
    if (!isConnected) {
      setSignatureRequired(false)
    }
  }, [isConnected])

  return {
    ...sessionQuery,
    signatureRequired,
    data: {
      ...sessionQuery.data,
      status:
        sessionQuery.isFetching ||
        sessionQuery.isLoading ||
        sessionQuery.isRefetching
          ? 'loading'
          : sessionQuery.data.status,
    },
  }
}
