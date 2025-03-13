import { UserModel } from '@/lib/mongo'
import { type Auth } from '@/types'
import { getBearerToken, getDynamicId, getPublicKeyFromJWKS } from '@/utils'
import { apiResponse, HTTPError } from '@inverter-network/sdk'
import type { Context } from 'hono'
import jwt from 'jsonwebtoken'

const dyanmicId = getDynamicId()
// Replace dynamicPublicKey with JWKS handling
const JWKS_URL = `https://app.dynamic.xyz/api/v0/sdk/${dyanmicId}/.well-known/jwks`

export async function verify(c: Context) {
  return await apiResponse(async () => {
    const publicKey = await getPublicKeyFromJWKS(JWKS_URL)
    if (!publicKey) throw new HTTPError('Public Key is not defined', 500)

    // Get Authorization Header
    const authToken = getBearerToken(c) // Get Bearer token

    // If no Authorization Header was found
    if (!authToken || authToken === 'undefined') {
      // c.req.session.destroy(() => {}) // Destroy the session
      throw new HTTPError(
        "<authorization: Bearer __token__> couldn't be found in the headers",
        404
      )
    }

    let decoded = {} as any
    let isVerified = false

    // Verify the Token and get the decoded data
    jwt.verify(authToken, publicKey, function (err, decodedRes) {
      if (!err) {
        isVerified = true
        decoded = decodedRes
        return
      }
      throw new HTTPError(err.message, 401)
    })

    // If the token is not verified
    if (!isVerified) {
      c.req.session.destroy(() => {}) // Destroy the session
      return new HTTPError('UnAuthorized Auth Token is not valid', 401)
    }

    const state: Auth = {
      // @ts-ignore
      address: decoded?.verified_credentials?.[0]?.address,
      // @ts-ignore
      email: decoded?.verified_credentials?.[0]?.email,
      role: 'USER',
    }

    const existingUser = await UserModel.findOne({
      address: state.address,
    }).lean()

    // Update State and handle session
    if (!!existingUser) {
      state.role = existingUser.role
      Object.assign(c.req.session, state)
    } else {
      try {
        await UserModel.create({
          address: state.address,
          email: state.email,
        })

        Object.assign(c.req.session, state)
      } catch (e: any) {
        throw e
      }
    }

    // Return the new Session
    return state
  })
}
