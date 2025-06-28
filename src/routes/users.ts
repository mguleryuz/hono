import { logger } from '@/utils'
import { Hono } from 'hono'

import { userService } from '..'

export const users = new Hono()

users.get('/', async (c) => {
  try {
    // Get pagination params from query
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')

    const { users, pagination } = await userService.getPaginatedUsers(
      page,
      limit
    )

    return c.json({
      users,
      pagination,
    })
  } catch (error) {
    logger.error('Error getting all users', error)
    return c.json({ users: [], pagination: null }, 500)
  }
})
