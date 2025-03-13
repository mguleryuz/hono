import { Schema } from 'mongoose'
import { EUserRole, type User } from '@/lib/mongo'

import { ApiSecretSchema } from './api-secret'

export const UserSchema = new Schema<User>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: 'USER',
      enum: EUserRole,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
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
