import { model, Schema } from 'mongoose'
import type { TwitterRateLimit as TwitterApiRateLimit } from 'twitter-api-v2'

// ----------------------------------------------------------------------------
// ROLE

export enum EUserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER = 'SUPER',
}

export type UserRole = keyof typeof EUserRole

// ----------------------------------------------------------------------------
// API

export type ApiSecret = {
  title: string
  secret: string

  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------------------
// USER

// Extend the official TwitterRateLimit type with our context fields
export interface TwitterRateLimitWithContext extends TwitterApiRateLimit {
  // Context fields for our application
  endpoint: string
  method: string
  lastUpdated: Date
}

export type User = {
  role: UserRole

  // CONFIGS
  initialAgentSetupPerformed: boolean

  // EVM
  address?: string

  // Twitter/X
  twitterAccessToken?: string
  twitterRefreshToken?: string
  twitterAccessTokenExpiresAt?: Date
  twitterUserId?: string
  twitterUsername?: string
  twitterDisplayName?: string
  twitterProfileImageUrl?: string
  twitterRateLimits?: TwitterRateLimitWithContext[]

  // Infra
  apiSecrets: ApiSecret[]
  webHookUrl?: string

  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------------------
// SCHEMAS

export const ApiSecretSchema = new Schema<ApiSecret>(
  {
    title: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
)

// Schema for the SingleTwitterRateLimit structure (used in main and day limits)
const SingleTwitterRateLimitSchema = {
  limit: {
    type: Number,
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
  reset: {
    type: Number, // Unix timestamp in seconds
    required: true,
  },
}

export const TwitterRateLimitSchema = new Schema<TwitterRateLimitWithContext>(
  {
    // Standard rate limit fields (SingleTwitterRateLimit)
    ...SingleTwitterRateLimitSchema,

    // Day limit fields (nested SingleTwitterRateLimit)
    day: {
      type: SingleTwitterRateLimitSchema,
      required: false,
    },

    // Context fields
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
)

export const UserSchema = new Schema<User>(
  {
    role: {
      type: String,
      default: 'USER',
      enum: EUserRole,
    },

    // CONFIGS
    initialAgentSetupPerformed: {
      type: Boolean,
      default: false,
    },

    // EVM
    address: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Twitter/X
    twitterAccessToken: {
      type: String,
    },
    twitterRefreshToken: {
      type: String,
    },
    twitterAccessTokenExpiresAt: {
      type: Date,
    },
    twitterUserId: {
      type: String,
      unique: true,
      sparse: true,
    },
    twitterUsername: {
      type: String,
    },
    twitterDisplayName: {
      type: String,
    },
    twitterProfileImageUrl: {
      type: String,
    },
    twitterRateLimits: {
      type: [TwitterRateLimitSchema],
      default: [],
    },

    // Infra
    apiSecrets: {
      type: [ApiSecretSchema],
      default: [],
    },
    webHookUrl: {
      type: String,
    },
  },
  { timestamps: true }
)

// ----------------------------------------------------------------------------
// MODEL

export const UserModel = model('users', UserSchema)
