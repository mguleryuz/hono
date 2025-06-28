import type { Client } from '@/api'
import type { CombinedSession } from '@/api/session.schema'
import type { HttpClientResponse } from '@effect/platform'
import type { Effect, Schema } from 'effect'
import type { DeepMutable } from 'effect/Types'

export type InternalSession = Partial<
  DeepMutable<Schema.Schema.Type<typeof CombinedSession>>
> & {
  nonce?: string
  whatsapp_otp?: number
  whatsapp_otp_expires_at?: number
}

export type GetRequestParams<
  X extends keyof Client,
  Y extends keyof Client[X],
> = Client[X][Y] extends (...args: any[]) => any
  ? Parameters<Client[X][Y]>[0]
  : never

export type GetReturnType<
  X extends keyof Client,
  Y extends keyof Client[X],
> = Client[X][Y] extends (...args: any[]) => any
  ? ReturnType<Client[X][Y]>
  : never

export type ExcludeHttpResponseTuple<T> = Exclude<
  T,
  readonly [any, HttpClientResponse.HttpClientResponse]
>

export type GetCleanSuccessType<
  X extends keyof Client,
  Y extends keyof Client[X],
> = ExcludeHttpResponseTuple<Effect.Effect.Success<GetReturnType<X, Y>>>

export type PromiseSuccess<
  X extends keyof Client,
  Y extends keyof Client[X],
> = Promise<GetCleanSuccessType<X, Y>>
