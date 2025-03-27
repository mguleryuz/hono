'use server'

import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import type { UserRole } from '@/types'
import type { Context } from 'hono'
import { authorized, HTTPError } from '@inverter-network/sdk'

type Hex = `0x${string}`

// Updated adminOnly function
export async function adminOnly(ctx: Context): Promise<{
  role: UserRole
  address: Hex | string
}> {
  const { role, address } = await getUserRoleFromTokenOrSession({ ctx })

  authorized(role)

  const isAdmin = ['ADMIN', 'SUPER'].includes(role)
  authorized(isAdmin, 'User is not an admin')

  return { role, address }
}

// Updated superOnly function
export async function superOnly(ctx: Context): Promise<{
  role: UserRole
  address: Hex | string
}> {
  const { role, address } = await getUserRoleFromTokenOrSession({ ctx })

  authorized(role)

  const isSuper = role === 'SUPER'
  authorized(isSuper, 'User is not a super admin')

  return { role, address }
}

async function getUserRoleFromTokenOrSession({
  ctx,
}: {
  ctx: Context
}): Promise<{
  role: UserRole
  address: Hex | string
}> {
  const sessionRole = ctx.req.session?.auth?.role
  const sessionAddress = ctx.req.session?.auth?.address

  if (sessionRole && sessionAddress) {
    return { role: sessionRole, address: sessionAddress }
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
