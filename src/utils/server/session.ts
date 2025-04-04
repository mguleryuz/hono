import session from 'hono-sess'
import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'
import { getSessionSecret } from '@/utils'

export const sessionMiddleware = () => {
  const mongoStore = MongoStore.create({
    client: mongoose.connection.getClient(),
    stringify: false,
  })

  const secret = getSessionSecret()

  return session({
    secret,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    proxy: true,
  })
}
