import { ApiSecretSchema, type User } from '@/mongo'
import { mongooseToEffectSchema } from '@/utils'
import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

import { PaginationResponse } from './base.schema'

export const ApiSecret = mongooseToEffectSchema(ApiSecretSchema)

export const TwitterRateLimit = Schema.Struct({
  endpoint: Schema.String,
  method: Schema.String,
  last_updated: Schema.Date,
})

export const UsersQueryParams = Schema.Struct({
  page: Schema.NumberFromString,
  limit: Schema.NumberFromString,
})

export const UserResponse = Schema.Struct({
  role: Schema.Literal('USER', 'ADMIN', 'SUPER'),
  address: Schema.optional(
    Schema.Union(Schema.TemplateLiteral('0x', Schema.String), Schema.String)
  ),
  whatsapp_phone: Schema.optional(Schema.String),
  api_secrets: Schema.Array(ApiSecret),
  web_hook_url: Schema.optional(Schema.String),
  twitter_access_token: Schema.optional(Schema.String),
  twitter_refresh_token: Schema.optional(Schema.String),
  twitter_access_token_expires_at: Schema.optional(Schema.Date),
  twitter_user_id: Schema.optional(Schema.String),
  twitter_username: Schema.optional(Schema.String),
  twitter_display_name: Schema.optional(Schema.String),
  twitter_profile_image_url: Schema.optional(Schema.String),
  twitter_rate_limits: Schema.optional(Schema.Array(TwitterRateLimit)),

  createdAt: Schema.Date,
  updatedAt: Schema.Date,
} satisfies Record<keyof User, any>)

export const PublicUserResponse = UserResponse.omit('api_secrets')

export const UsersResponse = Schema.Struct({
  users: Schema.Array(PublicUserResponse),
  pagination: PaginationResponse,
})

export const usersGroup = HttpApiGroup.make('users')
  .add(
    HttpApiEndpoint.get('', '/')
      .setUrlParams(UsersQueryParams)
      .addSuccess(UsersResponse)
  )
  .prefix('/users')
