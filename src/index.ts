// Dependencies
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

// Utils
import { connectDb, sessionMiddleware } from '@/utils/server'
import { logger as log } from '@/utils/logger'

// Services
import { BucketService } from '@/bucket.service'

// Handlers
import { Routes } from '@/routes'
import { Jobs } from '@/jobs'
import { TwitterService } from './twitter.service'
import { AuthXService } from './auth.x.service'
import { AuthEvmService } from './auth.evm.service'
import { SocialDataService } from './socialdata.service'

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
