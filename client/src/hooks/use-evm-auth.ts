import type { Auth } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

export type UseEvmAuthReturnType = ReturnType<typeof useEvmAuth>

export function useEvmAuth() {
  const { isConnected } = useAccount()

  const authQuery = useQuery({
    queryKey: ['auth', isConnected],
    queryFn: async () => {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

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
    enabled: isConnected,
  })

  return {
    ...authQuery,
    data: {
      ...authQuery.data,
      status:
        authQuery.isPending || authQuery.isLoading || authQuery.isFetching
          ? 'loading'
          : authQuery.data.status,
    },
  }
}
