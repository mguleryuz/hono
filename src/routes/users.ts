import { UserModel, type User } from '@/mongo/user.mongo'
import { logger } from '@/utils'
import { Hono } from 'hono'

export type UsersReturnType = Pick<
  User,
  | 'address'
  | 'twitterProfileImageUrl'
  | 'twitterUsername'
  | 'twitterDisplayName'
>[]

export const users = new Hono()

users.get('/users', async (c) => {
  try {
    const users = await UserModel.find()
      .sort({ points: -1 })
      .select(
        'address twitterUsername twitterDisplayName twitterProfileImageUrl'
      )
      .lean()

    return c.json(users)
  } catch (error) {
    logger.error('Error getting all users', error)
    return c.json([], 500)
  }
})
