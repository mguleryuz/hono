import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

import * as SessionSchema from './session.schema'

export const VerifyPayload = Schema.Struct({
  message: Schema.String,
  signature: Schema.TemplateLiteral(Schema.Literal('0x'), Schema.String),
})

export const VerifyResponse = Schema.Struct({
  success: Schema.Boolean,
})

export const NonceResponse = Schema.String

export const SignOutResponse = Schema.Struct({
  success: Schema.Boolean,
})

/**
 * @description EVM auth endpoints group with fluent API
 */
export const evmAuthGroup = HttpApiGroup.make('evmAuth')
  .add(HttpApiEndpoint.get('nonce', '/nonce').addSuccess(NonceResponse))
  .add(
    HttpApiEndpoint.post('verify', '/verify')
      .setPayload(VerifyPayload)
      .addSuccess(VerifyResponse)
  )
  .add(
    HttpApiEndpoint.get('session', '/session').addSuccess(
      SessionSchema.ChainSession
    )
  )
  .add(HttpApiEndpoint.get('signout', '/signout').addSuccess(SignOutResponse))
  .prefix('/auth/evm')
