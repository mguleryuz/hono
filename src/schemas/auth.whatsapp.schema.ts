import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

import * as SessionSchema from './session.schema'

/**
 * @description Phone number payload for sending OTP
 */
export const SendOtpPayload = Schema.Struct({
  phone_number: Schema.String,
})

/**
 * @description Response from sending OTP
 */
export const SendOtpResponse = Schema.Struct({
  success: Schema.Boolean,
  message: Schema.String,
})

/**
 * @description OTP verification payload
 */
export const VerifyOtpPayload = Schema.Struct({
  otp_code: Schema.String,
})

/**
 * @description Sign out response
 */
export const SignOutResponse = Schema.Struct({
  success: Schema.Boolean,
})

/**
 * @description WhatsApp auth endpoints group with fluent API
 */
export const whatsappAuthGroup = HttpApiGroup.make('whatsappAuth')
  .add(
    HttpApiEndpoint.post('sendOtp', '/send-otp')
      .setPayload(SendOtpPayload)
      .addSuccess(SendOtpResponse)
  )
  .add(
    HttpApiEndpoint.post('verifyOtp', '/verify-otp')
      .setPayload(VerifyOtpPayload)
      .addSuccess(SessionSchema.WhatsAppSession)
  )
  .add(
    HttpApiEndpoint.get('session', '/session').addSuccess(
      SessionSchema.WhatsAppSession
    )
  )
  .add(HttpApiEndpoint.get('signout', '/signout').addSuccess(SignOutResponse))
  .prefix('/auth/whatsapp')
