// Dependencies

// Services
import { BucketService } from '@/bucket.service'
// Handlers
import { Routes } from '@/routes'
import { logger as log } from '@/utils/logger'
// Utils
import { connectDb, sessionMiddleware } from '@/utils/server'
import { Hono } from 'hono'
import { compress } from 'hono-compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { AuthEvmService } from './auth.evm.service'
import { AuthWhatsAppService } from './auth.whatsapp.service'
import { AuthXService } from './auth.x.service'
import { UserService } from './user.service'
import { XService } from './x.service'

// ------------------------------------------------------------
// Server

// Environment configuration
const isDev = process.env.NODE_ENV === 'development'

// Initialize application
const app = new Hono()

// Compression middleware - should be one of the first middlewares
app.use(
  '*',
  compress({
    encoding: 'gzip', // or 'br' for brotli
  })
)

// Cache middleware for static assets
app.use('/static/*', async (c, next) => {
  await next()

  // Set cache headers for static assets
  const contentType = c.res.headers.get('content-type') || ''

  if (
    contentType.includes('image/') ||
    contentType.includes('font/') ||
    contentType.includes('application/javascript') ||
    contentType.includes('text/css')
  ) {
    // Cache for 1 year for versioned assets
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    // Cache for 1 hour for other static files
    c.header('Cache-Control', 'public, max-age=3600')
  }
})

// Cache middleware for assets
app.use('/assets/*', async (c, next) => {
  await next()
  // Vite generates hashed filenames, so we can cache aggressively
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

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
export const authEvmService = new AuthEvmService()
export const xService = new XService()
export const authXService = new AuthXService(xService.client)
export const authWhatsAppService = new AuthWhatsAppService()
export const userService = new UserService()

// Setup routes
new Routes(app, isDev)

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080

// Export server configuration
export default {
  port,
  fetch: app.fetch,
}
