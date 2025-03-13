'use server'

import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import { UserModel } from '@/lib/mongo'
import type { UserRole } from '@/types'
import type { Context } from 'hono'
import { authorized } from '@inverter-network/sdk'
import { splitBearerToken } from '.'

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
  const token = ctx.req.header('authorization')?.split(' ')[1]
  const sessionRole = ctx.req.session?.auth?.role
  const sessionAddress = ctx.req.session?.auth?.address

  if (sessionRole && sessionAddress) {
    return { role: sessionRole, address: sessionAddress }
  }

  authorized(token, 'No Bearer Token provided')

  const { key, secret } = splitBearerToken(token)

  const user = await UserModel.findOne(
    { 'apiSecrets.uid': key },
    { 'apiSecrets.$': 1, role: 1, address: 1 }
  ).lean()

  const hashedSecret = user?.apiSecrets?.find(
    (secret) => secret.uid === key
  )?.hashedSecret

  authorized(hashedSecret, 'No matching apiSecret found')

  const isValidSecret = await compareApiSecret(secret, hashedSecret)
  authorized(isValidSecret, 'Invalid API secret')

  return {
    role: user!.role as UserRole,
    address: user!.address as Hex,
  }
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
