import type { Schema } from 'mongoose'
import type { IfNever } from 'type-fest-4'

/**
 * Omit never values from an object type
 * @template T - The object type to omit never values from
 * @returns The object type with never values omitted
 */
export type OmitNever<T> = {
  [K in keyof T as IfNever<T[K], never, K>]: T[K]
}

/**
 * @description Extract schema options from Mongoose schema
 */
export type ExtractMongoSchemaOptions<T> =
  T extends Schema<any, any, any, any, any, any, infer TOptions> ? TOptions : {}
