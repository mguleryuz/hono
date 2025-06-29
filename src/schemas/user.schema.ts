import { Schema } from 'effect'

// ----------------------------------------------------------------------------
// ROLE

export const UserRoleSchema = Schema.Literal(
  'USER',
  'ADMIN',
  'SUPER'
).annotations({
  title: 'UserRole',
  description: 'User role enumeration defining access levels in the system',
})

export type UserRole = typeof UserRoleSchema.Type

// ----------------------------------------------------------------------------
// API

export const ApiSecretSchema = Schema.Struct({
  title: Schema.String,
  secret: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotations({
  title: 'ApiSecret',
  description: 'API secret configuration for user authentication',
  examples: [
    {
      title: 'Production API Key',
      secret: 'sk_live_abc123...',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
})

export type ApiSecret = typeof ApiSecretSchema.Type

// ----------------------------------------------------------------------------
// RATE LIMITS

export const XRateLimitSchema = Schema.Struct({
  endpoint: Schema.String,
  method: Schema.String,
  last_updated: Schema.Date,
}).annotations({
  title: 'XRateLimit',
  description: 'Twitter/X API rate limit tracking metadata',
  examples: [
    {
      endpoint: 'tweets/search/recent',
      method: 'GET',
      last_updated: new Date(),
    },
  ],
})

export type XRateLimit = typeof XRateLimitSchema.Type

export const TwitterApiRateLimitSchema = Schema.Struct({
  limit: Schema.Number.annotations({
    description: 'Maximum requests allowed',
  }),
  remaining: Schema.Number.annotations({
    description: 'Requests remaining',
  }),
  reset: Schema.Number.annotations({
    description: 'Unix timestamp when limit resets',
  }),
  day: Schema.optional(
    Schema.Struct({
      limit: Schema.Number,
      remaining: Schema.Number,
      reset: Schema.Number,
    }).annotations({
      description: 'Optional daily limits',
    })
  ),
}).annotations({
  title: 'TwitterApiRateLimit',
  description: 'Twitter API rate limit structure from twitter-api-v2 library',
  examples: [
    {
      limit: 15,
      remaining: 14,
      reset: 1234567890,
      day: {
        limit: 1000,
        remaining: 950,
        reset: 1234567890,
      },
    },
  ],
})

export type TwitterApiRateLimit = typeof TwitterApiRateLimitSchema.Type

export const XRateLimitWithContextSchema = Schema.extend(
  TwitterApiRateLimitSchema,
  XRateLimitSchema
).annotations({
  title: 'XRateLimitWithContext',
  description:
    'Combines Twitter API rate limit data with additional context fields',
  examples: [
    {
      limit: 15,
      remaining: 14,
      reset: 1234567890,
      endpoint: 'tweets/search/recent',
      method: 'GET',
      last_updated: new Date(),
    },
  ],
})

export type XRateLimitWithContext = typeof XRateLimitWithContextSchema.Type

// ----------------------------------------------------------------------------
// USER

export const UserSchema = Schema.Struct({
  role: UserRoleSchema.annotations({
    description: "User's role in the system (USER, ADMIN, or SUPER)",
  }),

  // EVM
  address: Schema.optional(Schema.String).annotations({
    description: 'Ethereum/EVM wallet address',
  }),

  // Twitter/X
  x_access_token: Schema.optional(Schema.String).annotations({
    description: 'OAuth2 access token for Twitter/X API',
  }),
  x_refresh_token: Schema.optional(Schema.String).annotations({
    description: 'OAuth2 refresh token for Twitter/X API',
  }),
  x_access_token_expires_at: Schema.optional(Schema.Date).annotations({
    description: 'Expiration timestamp for Twitter/X access token',
  }),

  x_user_id: Schema.optional(Schema.String).annotations({
    description: 'Twitter/X user ID',
  }),
  x_username: Schema.optional(Schema.String).annotations({
    description: 'Twitter/X username (handle without @)',
  }),
  x_display_name: Schema.optional(Schema.String).annotations({
    description: 'Twitter/X display name',
  }),
  x_profile_image_url: Schema.optional(Schema.String).annotations({
    description: 'URL to Twitter/X profile image',
  }),
  x_rate_limits: Schema.optional(
    Schema.Array(XRateLimitWithContextSchema)
  ).annotations({
    description: 'Array of Twitter/X API rate limit tracking data',
  }),

  // WhatsApp
  whatsapp_phone: Schema.optional(Schema.String).annotations({
    description: 'WhatsApp phone number in international format',
  }),

  // Infra
  api_secrets: Schema.Array(ApiSecretSchema).annotations({
    description: 'Array of API secrets for authentication',
  }),
  web_hook_url: Schema.optional(Schema.String).annotations({
    description: 'Webhook URL for notifications and callbacks',
  }),
  createdAt: Schema.Date.annotations({
    description: 'Timestamp when user was created',
  }),
  updatedAt: Schema.Date.annotations({
    description: 'Timestamp when user was last updated',
  }),
}).annotations({
  title: 'User',
  description: 'User model used in the database',
})

export type User = typeof UserSchema.Type
