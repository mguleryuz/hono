'use client'

import type { Auth } from '@/types'
import { getAuthMethod } from '@/utils/env'
import { useMutation, useQuery } from '@tanstack/react-query'

const authMethod = getAuthMethod()
const isAuthXEnabled = authMethod === 'twitter'

export type UserAuthXReturnType = ReturnType<typeof useAuthX>

export function useAuthX() {
  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const res = await fetch('/api/auth/x/current-user', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('User not found')
      }

      const json = <Auth>await res.json()

      return json
    },
    enabled: isAuthXEnabled,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const isLoggedIn = !!authQuery.data?.twitterUserId

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/x/logout', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to logout')
      }
    },
    onSuccess: () => {
      authQuery.refetch()
    },
  })

  return { ...authQuery, isLoggedIn, logout }
}
