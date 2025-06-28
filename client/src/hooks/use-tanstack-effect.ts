import type { Client } from '@/api'
import { ApiClient } from '@/api'
import type {
  GetCleanSuccessType,
  GetRequestParams,
  GetReturnType,
  PromiseSuccess,
} from '@/types'
import { FetchHttpClient } from '@effect/platform'
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { Effect, Layer } from 'effect'

// Create custom HttpClient layers with proper fetch configuration
const HttpClientWithCredentials = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(
      FetchHttpClient.Fetch,
      FetchHttpClient.Fetch.of(((
        input: RequestInfo | URL,
        init?: RequestInit | undefined
      ) => fetch(input, { ...init, credentials: 'include' })) as typeof fetch)
    )
  )
)

const HttpClientWithoutCredentials = FetchHttpClient.layer

// Create ApiClient layers with proper HttpClient dependencies
const ApiClientWithCredentials = ApiClient.Default.pipe(
  Layer.provide(HttpClientWithCredentials)
)

const ApiClientWithoutCredentials = ApiClient.Default.pipe(
  Layer.provide(HttpClientWithoutCredentials)
)

/**
 * @description Custom error class that preserves all Effect error properties
 * while still being a proper JavaScript Error for React Query
 */
export class EffectHttpError extends Error {
  readonly _tag: string
  readonly status?: number
  readonly error?: any
  readonly response?: Response
  readonly request?: Request

  constructor(effectError: any) {
    // Extract the user-friendly message
    const message =
      effectError?.error?.message ||
      effectError?.message ||
      'An unexpected error occurred'
    super(message)

    // Preserve the error name
    this.name = 'EffectHttpError'

    // Copy all properties from the original error
    Object.assign(this, effectError)

    // Ensure specific properties are preserved
    this._tag = effectError._tag || 'UnknownError'
    this.status = effectError.status
    this.error = effectError.error
    this.response = effectError.response
    this.request = effectError.request

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, EffectHttpError.prototype)
  }
}

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

/**
 * @description Create a function that given the group, method name and params returns a Promise that queries the API
 * @param section
 * @param method
 * @param params
 * @param includeCredentials - Whether to include credentials in the request (default: false)
 * @returns PromiseSuccess
 */
export function apiEffectRunner<
  X extends keyof Client,
  Y extends keyof Client[X],
>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>,
  includeCredentials = false
): PromiseSuccess<X, Y> {
  const program = apiEffect(section, method, params)
  const layer = includeCredentials
    ? ApiClientWithCredentials
    : ApiClientWithoutCredentials

  return Effect.runPromise(
    program.pipe(
      Effect.provide(layer),
      Effect.mapError((error) => new EffectHttpError(error))
    )
  )
}

/**
 * @description Options for API calls
 */
export interface ApiCallOptions {
  /**
   * @description Whether to include credentials (cookies) in the request
   * @default false
   */
  includeCredentials?: boolean
}

/**
 * @description Create the Tanstack query helper with proper initialData type inference
 * @param section
 * @param method
 * @param params
 * @param options - API call options and React Query options
 * @returns
 */

// Overload 1: When initialData is provided, data is non-nullable
export function useEffectQuery<
  X extends keyof Client,
  Y extends keyof Client[X],
>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>,
  options: ApiCallOptions &
    Omit<
      UseQueryOptions<GetCleanSuccessType<X, Y>, EffectHttpError>,
      'queryKey' | 'queryFn'
    > & {
      initialData: GetCleanSuccessType<X, Y> | (() => GetCleanSuccessType<X, Y>)
    }
): Omit<
  ReturnType<typeof useQuery<GetCleanSuccessType<X, Y>, EffectHttpError>>,
  'data'
> & {
  data: GetCleanSuccessType<X, Y>
}

// Overload 2: When initialData is not provided, data is nullable
export function useEffectQuery<
  X extends keyof Client,
  Y extends keyof Client[X],
>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>,
  options?: ApiCallOptions &
    Omit<
      UseQueryOptions<GetCleanSuccessType<X, Y>, EffectHttpError>,
      'queryKey' | 'queryFn'
    >
): ReturnType<typeof useQuery<GetCleanSuccessType<X, Y>, EffectHttpError>>

// Implementation
export function useEffectQuery<
  X extends keyof Client,
  Y extends keyof Client[X],
>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>,
  options?: ApiCallOptions &
    Omit<
      UseQueryOptions<GetCleanSuccessType<X, Y>, EffectHttpError>,
      'queryKey' | 'queryFn'
    >
) {
  const { includeCredentials = false, ...useQueryParams } = options || {}

  return useQuery({
    queryKey: [section, method, params, includeCredentials],
    queryFn: () => apiEffectRunner(section, method, params, includeCredentials),
    ...useQueryParams,
  })
}

/**
 * @description Create the Tanstack mutation helper with smart parameter handling
 * @param section
 * @param method
 * @param options - API call options and React Mutation options
 * @returns
 */
export function useEffectMutation<
  X extends keyof Client,
  Y extends keyof Client[X],
>(
  section: X,
  method: Y,
  options?: ApiCallOptions &
    Omit<
      UseMutationOptions<
        GetCleanSuccessType<X, Y>,
        EffectHttpError,
        GetRequestParams<X, Y> | undefined
      >,
      'mutationFn'
    >
) {
  const { includeCredentials = false, ...useMutationParams } = options || {}

  return useMutation({
    mutationFn: (params?: GetRequestParams<X, Y>) => {
      // Use empty object if no params provided
      const actualParams = params ?? ({} as GetRequestParams<X, Y>)
      return apiEffectRunner(section, method, actualParams, includeCredentials)
    },
    ...useMutationParams,
  })
}

/**
 * @description Create the Tanstack query key
 * @param section
 * @param method
 * @param params
 * @param includeCredentials - Whether credentials are included (affects cache key)
 * @returns
 */
export function getQueryKey<X extends keyof Client, Y extends keyof Client[X]>(
  section: X,
  method: Y,
  params: GetRequestParams<X, Y>,
  includeCredentials = false
) {
  return [section, method, params, includeCredentials] as const
}
