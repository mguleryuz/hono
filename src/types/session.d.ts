import type { Auth } from '@/types'
import type { RequestSessionExtender } from 'hono-sess'

// Extend the Hono Request type to include the session property
declare module 'hono' {
  interface HonoRequest
    extends RequestSessionExtender<{
      auth: Auth & {
        twitterState?: string
        twitterCodeVerifier?: string
        twitterAccessTokenExpiresAt?: Date
      }
    }> {}
}
