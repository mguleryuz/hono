import { isNotEmpty } from '@inverter-network/sdk'
import { createPublicKey } from 'crypto'
import type { Context } from 'hono'

type JWK = {
  kty: string
  n: string
  e: string
  alg: string
  kid: string
  use: string
}

export const getBearerToken = (c: Context) => {
  const token = c.req.header('authorization')?.split(' ')[1]
  return token
}

export const splitBearerToken = (token: string) => {
  const [key, secret] = token.split(':')

  isNotEmpty(key || secret, 'Key or Secret is empty')

  return { key, secret }
}

export async function getPublicKeyFromJWKS(JWKS_URL: string): Promise<string> {
  const response = await fetch(JWKS_URL)
  const jwks: { keys: JWK[] } = await response.json()
  const jwk = jwks.keys[0]

  const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
    .export({
      type: 'spki', // Changed from pkcs1 to spki
      format: 'pem',
    })
    .toString()

  return publicKey
}
