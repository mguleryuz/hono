import { UserSchema } from '@/schemas'
import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

import { PaginationResponse } from './base.schema'

export const UsersQueryParams = Schema.Struct({
  page: Schema.NumberFromString.annotations({
    title: 'Page Number',
    description: 'The page number for pagination (1-based)',
    examples: [1, 2, 3],
  }),
  limit: Schema.NumberFromString.annotations({
    title: 'Page Limit',
    description: 'Number of items per page',
    examples: [10, 25, 50],
  }),
}).annotations({
  title: 'Users Query Parameters',
  description: 'Query parameters for fetching users list',
})

export const PublicUserResponse = UserSchema.omit('api_secrets').annotations({
  title: 'Public User',
  description: 'User information without sensitive data like API secrets',
})

export const UsersResponse = Schema.Struct({
  users: Schema.Array(PublicUserResponse).annotations({
    description: 'Array of user objects',
  }),
  pagination: PaginationResponse.annotations({
    description: 'Pagination metadata',
  }),
}).annotations({
  title: 'Users List Response',
  description: 'Response containing paginated list of users',
})

export const usersGroup = HttpApiGroup.make('users')
  .add(
    HttpApiEndpoint.get('', '/')
      .setUrlParams(UsersQueryParams)
      .addSuccess(UsersResponse)
  )
  .prefix('/users')
