import { Schema, model } from 'mongoose'

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

export type User = {
  role: UserRole

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
