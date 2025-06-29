import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

import { XSession } from './session.schema'

export const LoginResponse = Schema.Struct({
  url: Schema.String,
})

export const CallbackResponse = Schema.Struct({
  success: Schema.Boolean,
})

export const LogoutResponse = Schema.Struct({
  success: Schema.Boolean,
})

/**
 * @description Twitter/X auth endpoints group with fluent API
 */
export const authXGroup = HttpApiGroup.make('auth-x')
  .add(HttpApiEndpoint.get('login', '/login').addSuccess(LoginResponse))
  .add(
    HttpApiEndpoint.get('callback', '/callback').addSuccess(CallbackResponse)
  )
  .add(HttpApiEndpoint.get('session', '/session').addSuccess(XSession))
  .add(HttpApiEndpoint.get('logout', '/logout').addSuccess(LogoutResponse))
  .prefix('/auth/x')
