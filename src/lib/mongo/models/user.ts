import { model } from 'mongoose'
import { UserSchema } from '@/lib/mongo'

export const UserModel = model('users', UserSchema)
