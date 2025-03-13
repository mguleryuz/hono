import type { User } from '@/types'

export type Auth = Omit<User, 'createdAt' | 'updatedAt' | 'apiSecrets' | 'uid'>
