import type { StatusCode } from 'hono/utils/http-status'

export * from './env'
export * from './logger'

export class HTTPError extends Error {
  statusCode: StatusCode
  constructor(message: string, statusCode: StatusCode) {
    super(message) // Pass the message to the base Error class
    this.statusCode = statusCode // Assign the statusCode value
  }
}
