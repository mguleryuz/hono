import { Schema } from 'effect'

import { TwitterRateLimit } from './users.schema'

/**
 * @description Base session
 */
const BaseSession = Schema.Struct({
  mongo_id: Schema.String,
  role: Schema.String,
  status: Schema.Union(
    Schema.Literal('authenticated'),
    Schema.Literal('unauthenticated'),
    Schema.Literal('loading')
  ),
})

/**
 * @description WhatsApp session response
 */
export const WhatsAppSession = Schema.Struct({
  ...BaseSession.fields,
  whatsapp_phone: Schema.String,
})

/**
 * @description Twitter/X session response
 */
export const XSession = Schema.Struct({
  ...BaseSession.fields,
  twitter_user_id: Schema.String,
  twitter_username: Schema.String,
  twitter_display_name: Schema.String,
  twitter_profile_image_url: Schema.String,
  twitter_rate_limits: Schema.Array(TwitterRateLimit),
})

/**
 * @description Chain session response
 */
export const ChainSession = Schema.Struct({
  ...BaseSession.fields,
  address: Schema.Union(
    Schema.TemplateLiteral('0x', Schema.String),
    Schema.String
  ),
})

/**
 * @description Combined session response - Combines all session types
 */
export const CombinedSession = Schema.Struct({
  ...BaseSession.fields,
  ...Schema.Struct({
    address: Schema.Union(
      Schema.TemplateLiteral('0x', Schema.String),
      Schema.String
    ),
  }).fields,
  whatsapp_phone: Schema.optional(Schema.String),
  twitter_user_id: Schema.String,
  twitter_username: Schema.String,
  twitter_display_name: Schema.String,
  twitter_profile_image_url: Schema.String,
  twitter_rate_limits: TwitterRateLimit,
})

/**
 * @description Authenticated chain session response
 */
export const AuthenticatedChainSession = Schema.Struct({
  ...BaseSession.fields,
  address: Schema.Union(
    Schema.TemplateLiteral('0x', Schema.String),
    Schema.String
  ),
  status: Schema.Literal('authenticated'),
})

/**
 * @description Authenticated WhatsApp session response
 */
export const AuthenticatedWhatsAppSession = Schema.Struct({
  ...BaseSession.fields,
  whatsapp_phone: Schema.String,
  status: Schema.Literal('authenticated'),
})

/**
 * @description Authenticated X session response
 */
export const AuthenticatedXSession = Schema.Struct({
  ...XSession.fields,
  status: Schema.Literal('authenticated'),
})

/**
 * @description Authenticated combined session response
 */
export const AuthenticatedCombinedSession = Schema.Struct({
  ...CombinedSession.fields,
  status: Schema.Literal('authenticated'),
})
