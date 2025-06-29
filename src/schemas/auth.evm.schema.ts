import * as SessionSchema from '@/schemas/session.schema'
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

export const VerifyPayload = Schema.Struct({
  message: Schema.String,
  signature: Schema.TemplateLiteral(Schema.Literal('0x'), Schema.String),
})

export const VerifyResponse = Schema.Struct({
  success: Schema.Boolean,
})

export const NonceResponse = Schema.String.pipe(
  HttpApiSchema.withEncoding({
    kind: 'Text',
    contentType: 'text/plain',
  })
)

export const SignOutResponse = Schema.Struct({
  success: Schema.Boolean,
})

/**
 * @description EVM auth endpoints group with fluent API
 */
export const authEvmGroup = HttpApiGroup.make('auth-evm')
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
