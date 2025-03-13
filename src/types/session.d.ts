import type { Auth } from './user'
import type { RequestSessionExtender } from 'hono-sess'

// Extend the Hono Request type to include the session property
declare module 'hono' {
  interface HonoRequest extends RequestSessionExtender<Auth> {}
}
