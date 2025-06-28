import { useQueryClient } from '@tanstack/react-query'

import {
  getQueryKey,
  useEffectMutation,
  useEffectQuery,
} from './use-tanstack-effect'

export function useAuthWhatsapp() {
  const queryClient = useQueryClient()

  // Check current session - needs credentials
  const {
    data: sessionData,
    isLoading,
    error,
  } = useEffectQuery(
    'whatsappAuth',
    'session',
    {},
    {
      includeCredentials: true,
      retry: false,
      refetchOnWindowFocus: false,
      // Return null on error (user not authenticated)
      throwOnError: false,
    }
  )

  // Determine if user is authenticated based on data and error
  const user = error ? null : sessionData

  // Send OTP mutation - needs credentials for session
  const sendOtpMutation = useEffectMutation('whatsappAuth', 'sendOtp', {
    includeCredentials: true,
    onError: (error: Error) => {
      console.error('Send OTP error:', error)
    },
  })

  // Verify OTP mutation - needs credentials for session
  const verifyOtpMutation = useEffectMutation('whatsappAuth', 'verifyOtp', {
    includeCredentials: true,
    onSuccess: (userData) => {
      // Invalidate and refetch the session query
      const sessionKey = getQueryKey('whatsappAuth', 'session', {}, true)
      queryClient.invalidateQueries({ queryKey: sessionKey })
    },
    onError: (error: Error) => {
      console.error('Verify OTP error:', error)
    },
  })

  // Sign out mutation - needs credentials for session
  const signOutMutation = useEffectMutation('whatsappAuth', 'signout', {
    includeCredentials: true,
    onSuccess: () => {
      // Clear the session cache
      const sessionKey = getQueryKey('whatsappAuth', 'session', {}, true)
      queryClient.setQueryData(sessionKey, null)
      queryClient.invalidateQueries({ queryKey: sessionKey })
    },
    onError: (error: Error) => {
      console.error('Sign out error:', error)
    },
  })

  return {
    user,
    isLoading,
    error: error?.message || null,
    sendOtp: sendOtpMutation.mutateAsync,
    sendOtpLoading: sendOtpMutation.isPending,
    sendOtpError: sendOtpMutation.error?.message || null,
    verifyOtp: verifyOtpMutation.mutateAsync,
    verifyOtpLoading: verifyOtpMutation.isPending,
    verifyOtpError: verifyOtpMutation.error?.message || null,
    signOut: signOutMutation.mutateAsync,
    signOutLoading: signOutMutation.isPending,
    signOutError: signOutMutation.error?.message || null,
  }
}
