import type { HTTPError } from '@/utils'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { authEvmService } from '..'

export const authEvm = new Hono()

authEvm.get('/nonce', async (c) => {
  try {
    const nonce = await authEvmService.nonce(c)
    return c.text(nonce)
  } catch (error: unknown) {
    const e = error as HTTPError

    return c.json({ message: e.message }, e.statusCode as ContentfulStatusCode)
  }
})

authEvm.post('/verify', async (c) => {
  try {
    const result = await authEvmService.verify(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPError
    return c.json({ message: e.message }, e.statusCode as ContentfulStatusCode)
  }
})

authEvm.get('/session', async (c) => {
  try {
    const result = await authEvmService.session(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPError
    return c.json({ message: e.message }, e.statusCode as ContentfulStatusCode)
  }
})

authEvm.get('/signout', async (c) => {
  try {
    const result = await authEvmService.signout(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPError
    return c.json({ message: e.message }, e.statusCode as ContentfulStatusCode)
  }
})
