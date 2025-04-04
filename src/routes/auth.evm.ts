import { Hono } from 'hono'
import { authEvmService } from '..'
import type { HTTPError } from '@/utils'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const authEvm = (api: Hono) => {
  api.get('/auth/evm/nonce', async (c) => {
    try {
      const nonce = await authEvmService.nonce(c)
      return c.text(nonce)
    } catch (error: unknown) {
      const e = error as HTTPError

      return c.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.post('/auth/evm/verify', async (c) => {
    try {
      const result = await authEvmService.verify(c)
      return c.json(result)
    } catch (error: unknown) {
      const e = error as HTTPError
      return c.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.get('/auth/evm/session', async (c) => {
    try {
      const result = await authEvmService.session(c)
      return c.json(result)
    } catch (error: unknown) {
      const e = error as HTTPError
      return c.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })

  api.post('/auth/evm/signout', async (c) => {
    try {
      const result = await authEvmService.signout(c)
      return c.json(result)
    } catch (error: unknown) {
      const e = error as HTTPError
      return c.json(
        { message: e.message },
        e.statusCode as ContentfulStatusCode
      )
    }
  })
}
