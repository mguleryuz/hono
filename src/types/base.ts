import type { User } from '@/types'

export type Auth = {
  id: string
  status?: 'unauthenticated' | 'authenticated' | 'loading'
} & Pick<
  User,
  | 'role'
  | 'address'
  | 'twitterUserId'
  | 'twitterUsername'
  | 'twitterDisplayName'
  | 'twitterProfileImageUrl'
  | 'twitterRateLimits'
>
