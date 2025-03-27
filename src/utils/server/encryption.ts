import crypto from 'crypto'
import { getSessionSecret } from '@/utils'

const sessionSecret = getSessionSecret()

export function encryptToken(token?: string): string {
  if (!token) return ''

  // Derive a 32-byte key using SHA-256
  const key = crypto.createHash('sha256').update(sessionSecret).digest()

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, encryptedHex] = encryptedToken.split(':')
  const iv = Buffer.from(ivHex, 'hex')

  // Derive the same 32-byte key using SHA-256
  const key = crypto.createHash('sha256').update(sessionSecret).digest()

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
