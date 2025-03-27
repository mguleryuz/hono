// Core imports
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'

// Database
import mongoose from 'mongoose'
import { connectDB } from '@/utils/server'

// Local imports
import { Routes } from '@/routes'
import { MainService } from '@/services'
import { serveClientHtml, ascii_welcome_div } from '@/utils'
import { sessionMiddleware } from '@/middlewares'

// Environment configuration
const isDev = process.env.NODE_ENV === 'development'

// Initialize application
const app = new Hono()

// Development middleware
if (isDev) app.use(logger())

// Database connection
await connectDB()

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

// Session handling
app.use(sessionMiddleware(mongoose))

// Initialize services
export const mainService = new MainService()

// Favicon
app.get('/favicon.ico', (c) => {
  return c.redirect('/static/favicon.ico')
})

// Static file serving
app.use('/static/*', serveStatic({ root: './' }))

// API routes
const api = app.basePath('/api')
api.get('/', (c) => c.html(ascii_welcome_div))
api.get('/verify', Routes.verify)

// Client-side routing
if (isDev) {
  app.all('/*', serveClientHtml)
} else {
  // Production static file serving
  app.all('/*', serveStatic({ root: './client/dist' }))
  app.all('/*', serveStatic({ path: './client/dist/index.html' }))
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080

// Export server configuration
export default {
  port,
  fetch: app.fetch,
}
