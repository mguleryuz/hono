import { Hono } from 'hono'
import type { HTTPException } from 'hono/http-exception'

import { authEvmService } from '..'

export const authEvm = new Hono()

authEvm.get('/nonce', async (c) => {
  try {
    const nonce = await authEvmService.nonce(c)
    return c.text(nonce)
  } catch (error: unknown) {
    const e = error as HTTPException

    return c.json({ message: e.message }, e.status)
  }
})

authEvm.post('/verify', async (c) => {
  try {
    const result = await authEvmService.verify(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})

authEvm.get('/session', async (c) => {
  try {
    const result = await authEvmService.session(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})

authEvm.get('/signout', async (c) => {
  try {
    const result = await authEvmService.signout(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})
