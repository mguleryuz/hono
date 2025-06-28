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
  last_updated: Date
}

export type User = {
  role: UserRole

  // EVM
  address?: string

  // Twitter/X
  twitter_access_token?: string
  twitter_refresh_token?: string
  twitter_access_token_expires_at?: Date

  twitter_user_id?: string
  twitter_username?: string
  twitter_display_name?: string
  twitter_profile_image_url?: string
  twitter_rate_limits?: TwitterRateLimitWithContext[]

  // WhatsApp
  whatsapp_phone?: string

  // Infra
  api_secrets: ApiSecret[]
  web_hook_url?: string

  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------------------
// SCHEMAS

export const ApiSecretSchema = new Schema(
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
) satisfies Schema<ApiSecret>

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

export const TwitterRateLimitSchema = new Schema(
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
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
) satisfies Schema<TwitterRateLimitWithContext>

export const UserSchema = new Schema(
  {
    role: {
      type: String,
      default: 'USER',
      enum: EUserRole,
    },

    // EVM
    address: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Twitter/X
    twitter_access_token: {
      type: String,
    },
    twitter_refresh_token: {
      type: String,
    },
    twitter_access_token_expires_at: {
      type: Date,
    },
    twitter_user_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    twitter_username: {
      type: String,
    },
    twitter_display_name: {
      type: String,
    },
    twitter_profile_image_url: {
      type: String,
    },
    twitter_rate_limits: {
      type: [TwitterRateLimitSchema],
      default: [],
    },

    // WhatsApp
    whatsapp_phone: {
      type: String,
    },

    // Infra
    api_secrets: {
      type: [ApiSecretSchema],
      default: [],
    },
    web_hook_url: {
      type: String,
    },
  },
  { timestamps: true }
) satisfies Schema<User>

// ----------------------------------------------------------------------------
// MODEL

export const UserModel = model('users', UserSchema)
