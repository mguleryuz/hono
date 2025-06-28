import type { GetCleanSuccessType } from '@/types'

import { UserModel } from './mongo/user.mongo'

type UsersResponse = GetCleanSuccessType<'users', ''>

export class UserService {
  /**
   * @description Gets paginated users from the database
   * @param page - The page number
   * @param limit - The number of users per page
   * @returns The users object
   */
  async getPaginatedUsers(page: number, limit: number): Promise<UsersResponse> {
    // Validate pagination params
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page

    // Get total count for pagination
    const totalCount = await UserModel.countDocuments()

    // Get paginated users sorted by points
    const users = await UserModel.find(
      {},
      {
        api_secrets: 0,
      }
    )
      .sort({ points: -1 })
      .skip((validPage - 1) * validLimit)
      .limit(validLimit)
      .lean()

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validLimit)
    const hasNextPage = validPage < totalPages
    const hasPrevPage = validPage > 1

    return {
      users,
      pagination: {
        currentPage: validPage,
        totalPages,
        totalCount,
        limit: validLimit,
        hasNextPage,
        hasPrevPage,
      },
    }
  }
}
