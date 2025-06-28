import { TwitterRateLimitMongoStore } from '@/mongo/helpers'
import { getXClientId, getXClientSecret, logger } from '@/utils'
import { TwitterApiRateLimitPlugin } from '@twitter-api-v2/plugin-rate-limit'
import { CacheContainer } from 'node-ts-cache'
import { MemoryStorage } from 'node-ts-cache-storage-memory'
import { TwitterApi } from 'twitter-api-v2'

import { authXService } from '.'
import type { User } from './types'

// Simple rate limit response used throughout the app
export interface RateLimitInfo {
  limitReached: boolean
  resetTime?: Date
  remaining?: number
  limit?: number
  endpoint?: string
}

export class XService {
  private readonly _client: TwitterApi | undefined
  private _userClientsCache: CacheContainer
  private _rateLimitPlugin: TwitterApiRateLimitPlugin
  private _rateLimitStore: TwitterRateLimitMongoStore

  constructor() {
    const clientId = getXClientId()
    const clientSecret = getXClientSecret()

    // Initialize rate limit store and plugin
    this._rateLimitStore = new TwitterRateLimitMongoStore()
    this._rateLimitPlugin = new TwitterApiRateLimitPlugin(this._rateLimitStore)

    if (clientId && clientSecret) {
      this._client = new TwitterApi(
        { clientId, clientSecret },
        { plugins: [this._rateLimitPlugin] }
      )
    }

    this._userClientsCache = new CacheContainer(new MemoryStorage())
  }

  get client() {
    return this._client
  }

  getRateLimitPlugin(userId: string) {
    this._rateLimitStore.setCurrentUserId(userId)
    return this._rateLimitPlugin
  }

  get rateLimitStore() {
    return this._rateLimitStore
  }

  /**
   * Creates an authenticated Twitter client for a user
   */
  async createAuthenticatedClient(
    user: User & { id: string },
    validateToken: boolean = false
  ): Promise<TwitterApi | null> {
    try {
      // Check cache first
      const cachedClient = await this._userClientsCache.getItem<TwitterApi>(
        user.id
      )

      if (cachedClient) {
        logger.info(`Returning cached client for user ${user.twitter_username}`)
        return cachedClient
      }

      // Get fresh token and create client
      return await this.initializeUserClient(user, validateToken)
    } catch (error: any) {
      logger.error(
        `[AUTH ERROR] Error during client authentication: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    }
  }

  /**
   * Attempt to refresh authentication for a user
   * Call this when encountering 401 errors
   */
  async refreshAuthentication(userId: string): Promise<boolean> {
    try {
      logger.info(
        `[AUTH REFRESH] Attempting to refresh authentication for user ${userId}`
      )

      // Clear any cached clients
      try {
        await this._userClientsCache.setItem(userId, null, {
          ttl: 0,
        })
      } catch {
        // Ignore cache clearing errors
      }

      // Attempt to get a fresh token
      const freshToken = await authXService.getAccessToken(userId)

      if (freshToken) {
        logger.info(
          `[AUTH REFRESH] Successfully refreshed authentication for user ${userId}`
        )
        return true
      } else {
        logger.error(
          `[AUTH REFRESH] Failed to refresh authentication for user ${userId}`
        )
        return false
      }
    } catch (error) {
      logger.error(
        `[AUTH REFRESH] Error during authentication refresh: ${error instanceof Error ? error.message : String(error)}`
      )
      return false
    }
  }

  /**
   * Initialize a new Twitter client for a user
   */
  private async initializeUserClient(
    user: User & { id: string },
    validateToken: boolean = false
  ): Promise<TwitterApi | null> {
    const accessToken = await authXService.getAccessToken(user.id)

    if (!accessToken) {
      logger.error(
        `[AUTH ERROR] Invalid or missing access token for user ${user.twitter_username || user.id}`
      )
      return null
    }

    // Set the current user ID on the rate limit store
    this._rateLimitStore.setCurrentUserId(user.id)

    // Create client with rate limit plugin
    const userTwitterClient = new TwitterApi(accessToken, {
      plugins: [this._rateLimitPlugin],
    })

    try {
      if (validateToken) {
        const meResult = await userTwitterClient.v2.me()
        logger.info(`Successfully authenticated as: ${meResult.data.username}`)
      } else {
        logger.info(
          `Created Twitter client for user ${user.twitter_username} without validation`
        )
      }

      await this._userClientsCache.setItem(user.id, userTwitterClient, {
        ttl: 60 * 60 * 1, // 1 hours
      })

      return userTwitterClient
    } catch (error: any) {
      logger.error(
        `[AUTH ERROR] Error during client authentication: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    }
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

/**
 * Checks if a message has text content besides links and usernames
 */
export function hasTextContent(text: string): boolean {
  // Remove links and @<username>
  const cleanedText = text.replace(/https?:\/\/[^\s]+|@[^\s]+/g, '')
  return cleanedText.trim().length > 0
}
