// Dependencies

// Services
import { BucketService } from '@/bucket.service'
import { Jobs } from '@/jobs'
// Handlers
import { Routes } from '@/routes'
import { logger as log } from '@/utils/logger'
// Utils
import { connectDb, sessionMiddleware } from '@/utils/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { AuthEvmService } from './auth.evm.service'
import { AuthXService } from './auth.x.service'
import { SocialDataService } from './socialdata.service'
import { TwitterService } from './twitter.service'

// ------------------------------------------------------------
// Server

// Environment configuration
const isDev = process.env.NODE_ENV === 'development'

// Initialize application
const app = new Hono()

// Development middleware
if (isDev) app.use(logger())

// CORS configuration
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type'],
    credentials: true,
  })
)

// Database connection
await connectDb()

// Session handling
try {
  app.use(sessionMiddleware())
} catch {
  log.warn('Session middleware failed to initialize ⚠️, skipping...')
}

// Start services
export const bucketService = new BucketService()
export const twitterService = new TwitterService()
export const authXService = new AuthXService(twitterService.client)
export const authEvmService = new AuthEvmService()
export const socialdataService = new SocialDataService()

// Setup routes
new Routes(app, isDev)

// Start jobs
new Jobs()

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080

// Export server configuration
export default {
  port,
  fetch: app.fetch,
}
