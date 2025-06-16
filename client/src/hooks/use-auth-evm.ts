import type { Auth } from '@/types'
import { getAuthMethod } from '@/utils/env'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

const authMethod = getAuthMethod()
const isAuthEvmEnabled = authMethod === 'evm'

export type UseAuthEvmReturnType = ReturnType<typeof useAuthEvm>

export function useAuthEvm() {
  const { isConnected } = useAccount()

  const authQuery = useQuery({
    queryKey: ['auth', isConnected],
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

  return {
    ...authQuery,
    data: {
      ...authQuery.data,
      status:
        authQuery.isFetching || authQuery.isLoading || authQuery.isRefetching
          ? 'loading'
          : authQuery.data.status,
    },
  }
}
