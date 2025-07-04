import type {
  GetCleanSuccessType,
  GetRequestParams,
  InternalSession,
} from '@/types'
import { getPublicClient, logger } from '@/utils'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  generateSiweNonce,
  parseSiweMessage,
  type SiweMessage,
} from 'viem/siwe'

import { UserModel } from '../mongo'

type VerifyPayloadType = GetRequestParams<'auth-evm', 'verify'>['payload']
type VerifyResponseType = GetCleanSuccessType<'auth-evm', 'verify'>
type SessionType = GetCleanSuccessType<'auth-evm', 'session'>
type NonceResponseType = GetCleanSuccessType<'auth-evm', 'nonce'>
type SignOutResponseType = GetCleanSuccessType<'auth-evm', 'signout'>

export class AuthEvmService {
  nonce(c: Context): NonceResponseType {
    const nonce = generateSiweNonce()

    c.req.session.nonce = nonce

    return nonce
  }

  async verify(c: Context): Promise<VerifyResponseType> {
    const { message, signature }: VerifyPayloadType = await c.req.json()

    const siweMessage = parseSiweMessage(message) as SiweMessage

    const publicClient = await getPublicClient(siweMessage.chainId)

    const success = await publicClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature,
    })

    if (!success) {
      c.req.session.destroy()
      throw new HTTPException(401, {
        message: 'UnAuthorized verification was not successful',
      })
    }

    const nonce = c.req.session.nonce

    if (siweMessage.nonce !== nonce)
      throw new HTTPException(422, {
        message: 'Invalid nonce',
      })

    const { address } = siweMessage

    const existingUser = await UserModel.findOne({
      address,
    }).lean()

    const state: InternalSession = {
      mongo_id: existingUser?._id.toString(),
      role: 'USER',

      address: existingUser?.address,
      status: 'authenticated',
      nonce,
    }

    // Update State and handle session
    if (!!existingUser) {
      state.role = existingUser.role

      Object.assign(c.req.session, state)
    } // Create a new User in MongoDB and handle session
    else {
      try {
        const newUser = new UserModel({
          address,
        })

        // Save the new User
        await newUser.save()

        state.mongo_id = newUser._id.toString()

        Object.assign(c.req.session, state)
      } catch (e: any) {
        logger.error('Error creating new user:', e)
        throw e
      }
    }

    // Return the new Session
    return { success: true }
  }

  async session(c: Context): Promise<SessionType> {
    const sessionData = c.req.session

    if (!sessionData?.address || !sessionData?.role) {
      throw new HTTPException(401, {
        message: 'Unauthorized',
      })
    }

    return {
      mongo_id: sessionData.mongo_id!,
      address: sessionData.address!,
      role: sessionData.role,
      status: 'authenticated',
    }
  }

  signout(c: Context): SignOutResponseType {
    c.req.session.destroy()

    return { success: true }
  }
}
