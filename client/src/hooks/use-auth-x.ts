'use client'

import { useEffectMutation, useEffectQuery } from './use-tanstack-effect'

const authMethod = window.APP_CONFIG.AUTH_METHOD
const isAuthXEnabled = authMethod === 'x'

export type UserAuthXReturnType = ReturnType<typeof useAuthX>

export function useAuthX() {
  const sessionQuery = useEffectQuery(
    'auth-x',
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

  const isLoggedIn = !!sessionQuery.data?.x_user_id

  const logout = useEffectMutation('auth-x', 'logout', {
    includeCredentials: true,
    onSuccess: () => {
      sessionQuery.refetch()
    },
  })

  return { ...sessionQuery, isLoggedIn, logout }
}
