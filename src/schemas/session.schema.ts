import { AddressSchema, UserSchema } from '@/schemas'
import { Schema } from 'effect'

// Base session schema
const BaseSession = Schema.Struct({
  mongo_id: Schema.String,
  status: Schema.Union(
    Schema.Literal('authenticated'),
    Schema.Literal('unauthenticated'),
    Schema.Literal('loading')
  ),
  ...UserSchema.pick('role').fields,
}).annotations({ description: 'Base session' })

// Individual session types
export const WhatsAppSession = Schema.Struct({
  ...BaseSession.fields,
  ...UserSchema.pick('whatsapp_phone').fields,
}).annotations({ description: 'WhatsApp session response' })

export const XSession = Schema.Struct({
  ...BaseSession.fields,
  ...UserSchema.pick(
    'x_user_id',
    'x_username',
    'x_display_name',
    'x_profile_image_url',
    'x_rate_limits'
  ).fields,
}).annotations({ description: 'Twitter/X session response' })

export const ChainSession = Schema.Struct({
  ...BaseSession.fields,
  address: AddressSchema,
}).annotations({ description: 'Chain session response' })

// Combined session type
export const CombinedSession = Schema.Struct({
  ...BaseSession.fields,
  ...UserSchema.pick(
    'whatsapp_phone',
    'address',
    'x_user_id',
    'x_username',
    'x_display_name',
    'x_profile_image_url',
    'x_rate_limits'
  ).fields,
}).annotations({
  description: 'Combined session response - Combines all session types',
})

// Authenticated session types
export const AuthenticatedChainSession = Schema.Struct({
  ...BaseSession.fields,
  address: AddressSchema,
  status: Schema.Literal('authenticated'),
}).annotations({ description: 'Authenticated chain session response' })

export const AuthenticatedWhatsAppSession = Schema.Struct({
  ...BaseSession.fields,
  whatsapp_phone: Schema.String,
  status: Schema.Literal('authenticated'),
}).annotations({ description: 'Authenticated WhatsApp session response' })

export const AuthenticatedXSession = Schema.Struct({
  ...XSession.fields,
  status: Schema.Literal('authenticated'),
}).annotations({ description: 'Authenticated X session response' })

export const AuthenticatedCombinedSession = Schema.Struct({
  ...CombinedSession.fields,
  status: Schema.Literal('authenticated'),
}).annotations({ description: 'Authenticated combined session response' })
