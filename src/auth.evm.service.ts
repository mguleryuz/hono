import {
  generateSiweNonce,
  parseSiweMessage,
  type SiweMessage,
} from 'viem/siwe'

import { getPublicClient, HTTPError } from '@/utils'
import { UserModel } from './mongo'

import type { RequiredDeep } from 'type-fest'
import type { Context } from 'hono'

export class AuthEvmService {
  async nonce(c: Context) {
    const nonce = generateSiweNonce()

    c.req.session.auth.nonce = nonce

    return nonce
  }

  async verify(c: Context) {
    const { message, signature } = await c.req.json()

    const siweMessage = parseSiweMessage(message) as SiweMessage

    const publicClient = await getPublicClient(siweMessage.chainId)

    const success = await publicClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature,
    })

    if (!success) {
      c.req.session.destroy()
      throw new HTTPError('UnAuthorized verification was not successful', 401)
    }

    const nonce = c.req.session.auth?.nonce

    if (siweMessage.nonce !== nonce) throw new HTTPError('Invalid nonce', 422)

    const { address } = siweMessage

    const existingUser = await UserModel.findOne({
      address,
    }).lean()

    const state: Partial<typeof c.req.session.auth> = {
      id: existingUser?._id.toString(),
      role: 'USER',

      address,
      status: 'authenticated',
      nonce,
    }

    // Update State and handle session
    if (!!existingUser) {
      state.role = existingUser.role
      c.req.session.auth = state as RequiredDeep<typeof state>
    } // Create a new User in MongoDB and handle session
    else {
      try {
        const newUser = new UserModel({
          address: state.address,
        })

        // Save the new User
        await newUser.save()

        state.id = newUser._id.toString()

        c.req.session.auth = state as RequiredDeep<typeof state>
      } catch (e: any) {
        throw e
      }
    }

    // Return the new Session
    return state
  }

  async session(c: Context) {
    const sessionData = c.req.session.auth

    if (!sessionData?.address || !sessionData?.role) {
      throw new HTTPError('Unauthorized', 401)
    }

    return {
      address: sessionData.address,
      role: sessionData.role,
      status: 'authenticated',
    }
  }

  async signout(c: Context) {
    c.req.session.destroy()

    return { success: true }
  }
}
