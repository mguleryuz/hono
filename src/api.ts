import type { GetRequestParams, GetReturnType } from '@/types'
import { HttpApi, HttpApiClient } from '@effect/platform'
import { Effect, Schema } from 'effect'

import { authEvmGroup } from './schemas/auth.evm.schema'
import { authWhatsAppGroup } from './schemas/auth.whatsapp.schema'
import { authXGroup } from './schemas/auth.x.schema'
import { usersGroup } from './schemas/users.schema'

const ErrorResponse = Schema.Struct({
  message: Schema.String,
})

// Define the API contract
export const Api = HttpApi.make('Api')
  // Define global errors that apply to all endpoints
  .addError(ErrorResponse, { status: 400 }) // Bad Request
  .addError(ErrorResponse, { status: 401 }) // Unauthorized
  .addError(ErrorResponse, { status: 403 }) // Forbidden
  .addError(ErrorResponse, { status: 404 }) // Not Found
  .addError(ErrorResponse, { status: 500 }) // Internal Server Error
  .addError(ErrorResponse, { status: 503 }) // Service Unavailable
  .addError(ErrorResponse, { status: 504 }) // Gateway Timeout
  .addError(ErrorResponse, { status: 429 }) // Too Many Requests
  .addError(ErrorResponse, { status: 405 }) // Method Not Allowed
  .addError(ErrorResponse, { status: 406 }) // Not Acceptable
  .addError(ErrorResponse, { status: 408 }) // Request Timeout
  .addError(ErrorResponse, { status: 409 }) // Conflict
  .add(authWhatsAppGroup)
  .add(authEvmGroup)
  .add(usersGroup)
  .add(authXGroup)

/**
 * @description The api client service
 */
export class ApiClient extends Effect.Service<ApiClient>()('ApiClient', {
  effect: Effect.gen(function* () {
    return {
      client: yield* HttpApiClient.make(Api, {
        baseUrl: '/api',
      }),
    }
  }),
}) {}

/**
 * @description The api client type
 */
export type Client = ApiClient['client']

/**
 * @description The api effect function
 * @param section
 * @param method
 * @param params
 * @returns
 */
export function apiEffect<X extends keyof Client, Y extends keyof Client[X]>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>
): GetReturnType<X, Y> {
  const res = Effect.gen(function* () {
    const { client } = yield* ApiClient
    const sectionObj = client[section]
    const methodFn = sectionObj[method]
    if (typeof methodFn !== 'function') {
      throw new Error(
        `Method ${String(section)}.${String(method)} is not a function`
      )
    }
    return yield* (methodFn as any)(params)
  }) as GetReturnType<X, Y>
  return res
}
