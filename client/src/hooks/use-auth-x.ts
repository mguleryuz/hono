'use client'

import { getAuthMethod } from '@/utils/env'

import { useEffectMutation, useEffectQuery } from './use-tanstack-effect'

const authMethod = getAuthMethod()
const isAuthXEnabled = authMethod === 'x'

export type UserAuthXReturnType = ReturnType<typeof useAuthX>

export function useAuthX() {
  const sessionQuery = useEffectQuery(
    'twitterAuth',
    'session',
    {},
    {
      includeCredentials: true,
      retry: false,
      refetchOnWindowFocus: false,
      // Return null on error (user not authenticated)
      throwOnError: false,
      enabled: isAuthXEnabled,
    }
  )

  const isLoggedIn = !!sessionQuery.data?.twitter_user_id

  const logout = useEffectMutation('twitterAuth', 'logout', {
    includeCredentials: true,
    onSuccess: () => {
      sessionQuery.refetch()
    },
  })

  return { ...sessionQuery, isLoggedIn, logout }
}
