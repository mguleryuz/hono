'use client'

import { getBearerConfig } from '@c/utils'
import type { Auth } from '@/types'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

export function useAuth() {
  const { authToken } = useDynamicContext()
  const { isConnected } = useAccount()

  const authQuery = useQuery({
    queryKey: ['auth', authToken?.slice(0, 10)],
    queryFn: async () => {
      const config = getBearerConfig(authToken)
      const res = await fetch('/api/verify', config)

      const json = <Auth>await res.json()

      return json
    },
    enabled: !!authToken && isConnected,
    retry: 3,
    refetchOnWindowFocus: false,
  })

  return authQuery
}
