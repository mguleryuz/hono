import type { ApiSecret, User, XRateLimitWithContext } from '@/schemas'
import { model, Schema } from 'mongoose'

// ----------------------------------------------------------------------------
// ROLE

export enum EUserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER = 'SUPER',
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

export const TwitterRateLimitSchema = new Schema<XRateLimitWithContext>(
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
)

export const UserSchema = new Schema<User>(
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
)

// ----------------------------------------------------------------------------
// MODEL

export const UserModel = model('users', UserSchema)
