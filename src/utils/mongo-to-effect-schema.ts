import type { ExtractMongoSchemaOptions } from '@/types'
import { Schema } from 'effect'
import type { Schema as MongooseSchema, SchemaType } from 'mongoose'

/**
 * @description Base type for Effect schema fields
 */
type BaseEffectSchema =
  | typeof Schema.String
  | typeof Schema.Number
  | typeof Schema.Boolean
  | typeof Schema.Date
  | typeof Schema.Uint8Array
  | typeof Schema.Unknown
  | Schema.Schema<any, any, never>

/**
 * @description Simplified field mapping to prevent deep recursion
 */
type FieldMap = Record<string, BaseEffectSchema>

/**
 * @description Check if _id should be included
 */
type ShouldIncludeId<TOptions> = TOptions extends { _id: false } ? false : true

/**
 * @description Check if timestamps should be included
 */
type ShouldIncludeTimestamps<TOptions> = TOptions extends { timestamps: true }
  ? true
  : false

/**
 * @description Build the final schema type with conditional fields
 */
type BuildEffectSchema<TFields extends FieldMap, TOptions> = Schema.Struct<
  TFields &
    (ShouldIncludeId<TOptions> extends true
      ? { _id: typeof Schema.String }
      : {}) &
    (ShouldIncludeTimestamps<TOptions> extends true
      ? {
          createdAt: typeof Schema.Date
          updatedAt: typeof Schema.Date
        }
      : {})
>

/**
 * @description Converts Mongoose schema type to Effect schema type
 */
export type MongooseToEffectSchemaReturnType<TSchema> =
  TSchema extends MongooseSchema<infer TDocType>
    ? BuildEffectSchema<
        { [K in keyof TDocType]: BaseEffectSchema },
        ExtractMongoSchemaOptions<TSchema>
      >
    : never

/**
 * @description Converts a Mongoose schema to an Effect schema, copying the schema as-is
 * @template TSchema - The Mongoose schema instance type
 * @param {TSchema} mongooseSchema - The Mongoose schema to convert
 * @returns {MongooseToEffectSchemaReturnType<TSchema>} The corresponding Effect schema with automatically inferred _id and timestamps typing
 * @example
 * import { Schema } from 'mongoose'
 * import { mongooseToEffectSchema } from './mongo-to-effect-schema'
 *
 * // Define Mongoose schemas
 * const UserSchema = new Schema({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true },
 * }, { timestamps: true })
 *
 * const ApiSecretSchema = new Schema({
 *   title: String,
 *   secret: String
 * }, { _id: false, timestamps: true })
 *
 * // Convert to Effect schemas (automatically infers _id and timestamps from schema type)
 * const UserEffectSchema = mongooseToEffectSchema(UserSchema)
 * const ApiSecretEffectSchema = mongooseToEffectSchema(ApiSecretSchema)
 *
 * // Runtime behavior automatically matches schema settings
 * // Types automatically reflect _id and timestamps based on type T
 */
export function mongooseToEffectSchema<TSchema extends MongooseSchema<any>>(
  mongooseSchema: TSchema
): MongooseToEffectSchemaReturnType<TSchema> {
  // Build schema by collecting individual field schemas (1:1 conversion)
  const schemaFields: Record<string, Schema.Schema<any>> = {}

  // Process each path in the mongoose schema
  mongooseSchema.eachPath((pathname, schemaType) => {
    // Skip internal mongoose fields except _id
    if (pathname.startsWith('_') && pathname !== '_id') {
      return
    }

    // Convert the schema type to Effect schema
    const effectField = convertSchemaType(schemaType)
    if (effectField) {
      schemaFields[pathname] = effectField
    }
  })

  // Check schema settings and add fields accordingly
  const hasIdDisabled = mongooseSchema.get('_id') === false
  const hasTimestamps = mongooseSchema.get('timestamps') === true

  // Add _id field unless explicitly disabled
  if (!hasIdDisabled && !schemaFields._id) {
    schemaFields._id = Schema.String
  }

  // Add timestamp fields if schema has timestamps enabled
  if (hasTimestamps) {
    schemaFields.createdAt = Schema.Date
    schemaFields.updatedAt = Schema.Date
  }

  // Return the struct with proper typing
  return Schema.Struct(schemaFields) as any
}

/**
 * @description Converts a single Mongoose schema type to Effect schema
 * @param {SchemaType} schemaType - The Mongoose schema type to convert
 * @returns {any} The corresponding Effect schema
 */
function convertSchemaType(schemaType: SchemaType): any {
  const isRequired = schemaType.isRequired

  // Handle arrays
  if (schemaType.instance === 'Array') {
    const arraySchema = schemaType as any
    const itemType = arraySchema.schema || arraySchema.caster

    if (itemType) {
      const itemSchema = convertSchemaType(itemType)
      if (itemSchema) {
        const arrayField = Schema.Array(itemSchema)
        return isRequired ? arrayField : Schema.optional(arrayField)
      }
    }

    // Fallback for mixed arrays
    const mixedArrayField = Schema.Array(Schema.Unknown)
    return isRequired ? mixedArrayField : Schema.optional(mixedArrayField)
  }

  // Handle subdocuments/nested schemas - limit recursion depth
  if (schemaType.schema) {
    try {
      const nestedSchema = mongooseToEffectSchema(schemaType.schema)
      return isRequired ? nestedSchema : Schema.optional(nestedSchema)
    } catch (e) {
      // Fallback to Unknown if nested schema conversion fails
      console.warn(
        'Failed to convert nested schema, falling back to Unknown',
        e
      )
      return isRequired ? Schema.Unknown : Schema.optional(Schema.Unknown)
    }
  }

  // Handle basic types
  let effectSchema: any

  switch (schemaType.instance) {
    case 'String': {
      const stringSchema = schemaType as any

      // Handle enums
      if (stringSchema.enumValues && stringSchema.enumValues.length > 0) {
        const literals = stringSchema.enumValues.map((value: string) =>
          Schema.Literal(value)
        )
        effectSchema =
          literals.length === 1 ? literals[0] : Schema.Union(...literals)
      } else {
        effectSchema = Schema.String
      }
      break
    }

    case 'Number':
      effectSchema = Schema.Number
      break

    case 'Boolean':
      effectSchema = Schema.Boolean
      break

    case 'Date':
      effectSchema = Schema.Date
      break

    case 'ObjectID':
    case 'ObjectId':
      effectSchema = Schema.String
      break

    case 'Buffer':
      effectSchema = Schema.Uint8Array
      break

    case 'Mixed':
      effectSchema = Schema.Unknown
      break

    case 'Decimal128':
      effectSchema = Schema.Number
      break

    case 'Map':
      effectSchema = Schema.Record({
        key: Schema.String,
        value: Schema.Unknown,
      })
      break

    default:
      console.warn(`Unsupported Mongoose schema type: ${schemaType.instance}`)
      effectSchema = Schema.Unknown
      break
  }

  // Handle optional fields
  return effectSchema
    ? isRequired
      ? effectSchema
      : Schema.optional(effectSchema)
    : undefined
}
