import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { serveClientHtml } from '@/utils/server'
import { users } from './users'
import { authX } from './auth.x'
import { authEvm } from './auth.evm'

export class Routes {
  constructor(app: Hono, isDev: boolean) {
    // Favicon
    app.get('/favicon.ico', (c) => {
      return c.redirect('/static/favicon.ico')
    })

    // Static file serving
    app.use('/static/*', serveStatic({ root: './' }))

    // API routes - register these BEFORE the catch-all routes
    const api = app.basePath('/api')

    // Assign the API routes
    users(api)
    authX(api)
    authEvm(api)

    // Client-side routing - these should come AFTER API routes
    if (isDev) {
      // for dev, serve the images and fonts from the client/public folder
      app.use('/images/*', serveStatic({ root: './client/public' }))
      app.use('/fonts/*', serveStatic({ root: './client/public' }))

      // serve the client html
      app.all('/*', serveClientHtml)
    } else {
      // Production static file serving
      app.all('/*', serveStatic({ root: './client/dist' }))
      app.all('/*', serveStatic({ path: './client/dist/index.html' }))
    }
  }
}
