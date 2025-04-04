import type { HTTPError } from '@/utils'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { authService } from '..'

export const authX = (api: Hono) => {
  api.get('/auth/x/login', async (ctx) => {
    try {
      return authService.twitterLogin(ctx)
    } catch (error: unknown) {
      const e = error as HTTPError
      return ctx.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.get('/auth/x/callback', async (ctx) => {
    try {
      // Handle the callback, return the redirect
      return await authService.twitterCallback(ctx)
    } catch (error: unknown) {
      const e = error as HTTPError
      // Return the error
      return ctx.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.get('/auth/x/current-user', async (ctx) => {
    try {
      const result = await authService.getCurrentUser(ctx)
      return ctx.json(result)
    } catch (error: unknown) {
      const e = error as HTTPError
      return ctx.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.get('/auth/x/logout', async (ctx) => {
    try {
      return ctx.json(authService.logout(ctx))
    } catch (error: unknown) {
      const e = error as HTTPError
      return ctx.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })
}
