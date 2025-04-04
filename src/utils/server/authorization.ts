'use server'

import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import type { UserRole } from '@/types'
import type { Context } from 'hono'
import { HTTPError } from '..'

/**
 * Asserts that a value is not undefined or null
 * @template T - The type of the value
 * @param value - The value to assert
 * @param message - The message to throw if the value is undefined or null
 * @throws HTTPError if the value is undefined or null
 */
export function authorized(value: any, message?: string) {
  if (!value)
    throw new HTTPError(
      !!message ? `Unauthorized: ${message}` : 'Unauthorized',
      401
    )
}

// Updated adminOnly function
export async function adminOnly(ctx: Context): Promise<{
  role: UserRole
  id: string
}> {
  const { role, id } = await getUserRoleFromTokenOrSession({ ctx })

  authorized(role)

  const isAdmin = ['ADMIN', 'SUPER'].includes(role)
  authorized(isAdmin, 'User is not an admin')

  return { role, id }
}

// Updated superOnly function
export async function superOnly(ctx: Context): Promise<{
  role: UserRole
  id: string
}> {
  const { role, id } = await getUserRoleFromTokenOrSession({ ctx })

  authorized(role)

  const isSuper = role === 'SUPER'
  authorized(isSuper, 'User is not a super admin')

  return { role, id }
}

async function getUserRoleFromTokenOrSession({
  ctx,
}: {
  ctx: Context
}): Promise<{
  role: UserRole
  id: string
}> {
  const sessionRole = ctx.req.session?.auth?.role
  const sessionId = ctx.req.session?.auth?.id

  if (sessionRole && sessionId) {
    return { role: sessionRole, id: sessionId }
  }

  throw new HTTPError('No session found', 401)
}

const scryptAsync = promisify(scrypt)

// Function to hash an API secret
export async function hashApiSecret(apiSecret: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(apiSecret, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

// Function to compare a provided API secret with a hashed one
export async function compareApiSecret(
  providedSecret: string,
  storedHash: string
) {
  const [salt, key] = storedHash.split(':')
  const hash = (await scryptAsync(providedSecret, salt, 64)) as Buffer
  return key === hash.toString('hex')
}
