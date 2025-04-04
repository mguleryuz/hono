import { TwitterApi } from 'twitter-api-v2'
import {
  getTwitterAccessSecret,
  getTwitterAccessToken,
  getTwitterApiKey,
  getTwitterApiSecret,
  getXClientId,
  getXClientSecret,
  logger,
} from '@/utils'

export class TwitterService {
  private readonly _client: TwitterApi
  private readonly _userClient: TwitterApi

  constructor() {
    const clientId = getXClientId()
    const clientSecret = getXClientSecret()
    const accessToken = getTwitterAccessToken()
    const accessSecret = getTwitterAccessSecret()
    const appKey = getTwitterApiKey()
    const appSecret = getTwitterApiSecret()

    this._client = new TwitterApi({ clientId, clientSecret })
    this._userClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    })
  }

  get client() {
    return this._client
  }

  get userClient() {
    return this._userClient
  }
}

export function handleTwitterApiError(
  error: any,
  userId: string,
  operation: string
): void {
  logger.error(`${operation} failed: ${error.message}`)

  if (error.code === 401 || error.status === 401) {
    logger.error('User token unauthorized or expired')
  } else if (error.code === 429 || error.status === 429) {
    logger.error(`Rate limit exceeded for user ID ${userId}`)
    if (error.rateLimit?.reset) {
      const resetTime = new Date(Number(error.rateLimit.reset) * 1000)
      logger.info(`Rate limit resets at: ${resetTime.toISOString()}`)
    }
  } else if (error.code === 400 || error.status === 400) {
    logger.error(`Bad request error: ${error.data?.message || error.message}`)
    logger.error('This may be due to an invalid token format or missing scopes')
  }
}

/**
 * Formats a date to Twitter's search format: YYYY-MM-DD_HH:mm:ss_UTC
 */
export function formatTwitterDateString(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}_UTC`
}
