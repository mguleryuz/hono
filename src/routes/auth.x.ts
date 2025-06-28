import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { authXService } from '..'

export const authX = new Hono()

authX.get('/login', async (ctx) => {
  try {
    return authXService.login(ctx)
  } catch (error: unknown) {
    const e = error as HTTPException
    return ctx.json({ message: e.message }, e.status)
  }
})

authX.get('/callback', async (ctx) => {
  try {
    // Handle the callback, return the redirect
    return await authXService.callback(ctx)
  } catch (error: unknown) {
    const e = error as HTTPException
    // Return the error
    return ctx.json({ message: e.message }, e.status)
  }
})

authX.get('/session', async (ctx) => {
  try {
    const result = await authXService.getSession(ctx)
    return ctx.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return ctx.json({ message: e.message }, e.status)
  }
})

authX.get('/logout', async (ctx) => {
  try {
    return ctx.json(authXService.logout(ctx))
  } catch (error: unknown) {
    const e = error as HTTPException
    return ctx.json({ message: e.message }, e.status)
  }
})
