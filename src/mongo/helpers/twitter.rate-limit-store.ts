import { UserModel } from '@/mongo'
import type { XRateLimitWithContext } from '@/types'
import { logger } from '@/utils'
import type {
  ITwitterApiRateLimitGetArgs,
  ITwitterApiRateLimitSetArgs,
  ITwitterApiRateLimitStore,
} from '@twitter-api-v2/plugin-rate-limit'
import type { TwitterRateLimit as TwitterApiRateLimit } from 'twitter-api-v2'

// Map of API URL patterns to help with normalization
const API_PREFIXES = {
  'https://api.twitter.com/2/': true,
  'https://api.x.com/2/': true,
  'https://api.twitter.com/labs/2/': true,
  'https://api.twitter.com/1.1/': true,
  'https://upload.twitter.com/1.1/': true,
  'https://stream.twitter.com/1.1/': true,
}

/**
 * Normalizes Twitter API endpoints by handling different API URL patterns
 * This helps match endpoints regardless of the domain (twitter.com vs x.com) or prefix variation
 */
function normalizeEndpoint(endpoint: string): string {
  // If it's already a relative path (no protocol/domain), return as is
  if (!endpoint.startsWith('http')) {
    return endpoint
  }

  // Try to extract the path part after known prefixes
  for (const prefix of Object.keys(API_PREFIXES)) {
    if (endpoint.startsWith(prefix)) {
      return endpoint.substring(prefix.length)
    }
  }

  // If no known prefix is found, return the full endpoint
  return endpoint
}

/**
 * Custom rate limit store that persists rate limits to MongoDB
 * Provides database persistence without in-memory caching
 */
export class TwitterRateLimitMongoStore implements ITwitterApiRateLimitStore {
  /**
   * Initialize store with a specific user ID
   */
  constructor(private currentUserId?: string) {
    logger.info(
      `Initialized Twitter rate limit store${currentUserId ? ` for user ${currentUserId}` : ''}`
    )
  }

  /**
   * Set the current user ID that will be used for storing rate limits
   */
  setCurrentUserId(userId: string) {
    this.currentUserId = userId
  }

  /**
   * Get the rate limit for a specific endpoint
   */
  async get(
    args: ITwitterApiRateLimitGetArgs
  ): Promise<TwitterApiRateLimit | undefined> {
    // Only check database if we have a user ID and endpoint
    if (!this.currentUserId || !args.endpoint) {
      return undefined
    }

    try {
      const user = await UserModel.findById(
        this.currentUserId,
        'twitterRateLimits'
      ).lean()

      if (!user) return undefined

      // Normalize the requested endpoint for comparison
      const normalizedRequestEndpoint = normalizeEndpoint(args.endpoint)

      // Try to find the specific endpoint in the user's rate limits
      // First try exact match, then try normalized match
      let rateLimitEntry = user.x_rate_limits?.find(
        (rl) =>
          rl.endpoint === args.endpoint && rl.method === (args.method || 'GET')
      )

      // If exact match failed, try with normalized endpoints
      if (!rateLimitEntry) {
        rateLimitEntry = user.x_rate_limits?.find(
          (rl) =>
            normalizeEndpoint(rl.endpoint) === normalizedRequestEndpoint &&
            rl.method === (args.method || 'GET')
        )
      }

      if (rateLimitEntry && rateLimitEntry.reset) {
        // Convert reset timestamp to milliseconds for comparison
        const resetTimeMs = rateLimitEntry.reset * 1000

        // Check if day limit is reached
        const isDayLimited =
          rateLimitEntry.day?.remaining === 0 &&
          rateLimitEntry.day?.reset &&
          rateLimitEntry.day.reset * 1000 > Date.now()

        // Check if standard limit is reached
        const isStandardLimited =
          Date.now() < resetTimeMs && rateLimitEntry.remaining === 0

        // If either limit is still active, return the rate limit info
        if (isStandardLimited || isDayLimited) {
          // Create the API rate limit object
          const apiRateLimit: TwitterApiRateLimit = {
            limit: rateLimitEntry.limit,
            remaining: rateLimitEntry.remaining,
            reset: rateLimitEntry.reset,
          }

          // Add day limit info if available
          if (rateLimitEntry.day) {
            apiRateLimit.day = {
              limit: rateLimitEntry.day.limit,
              remaining: rateLimitEntry.day.remaining,
              reset: rateLimitEntry.day.reset,
            }
          }

          if (isDayLimited && rateLimitEntry.day) {
            logger.info(
              `Retrieved rate limit from database for ${args.endpoint}: Day limit reached, resets at ${new Date(rateLimitEntry.day.reset * 1000).toISOString()}`
            )
          } else {
            logger.info(
              `Retrieved rate limit from database for ${args.endpoint}: ${apiRateLimit.remaining}/${apiRateLimit.limit}, resets at ${new Date(apiRateLimit.reset * 1000).toISOString()}`
            )
          }

          return apiRateLimit
        }
      }

      return undefined
    } catch (error) {
      logger.error(
        `Error loading rate limit from database: ${error instanceof Error ? error.message : String(error)}`
      )
      return undefined
    }
  }

  /**
   * Store rate limit for a specific endpoint
   */
  async set(args: ITwitterApiRateLimitSetArgs): Promise<void> {
    const method = args.method
    const endpoint = args.endpoint
    const rateLimit = args.rateLimit

    // Store in database if we have a user ID
    if (!this.currentUserId) {
      return
    }

    try {
      // Create rate limit data that includes both Twitter API fields and our context
      const rateLimitData: XRateLimitWithContext = {
        // Twitter API fields
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,

        // Day limit fields if available
        ...(rateLimit.day && { day: rateLimit.day }),

        // Our context fields
        endpoint: endpoint,
        method: method,
        last_updated: new Date(),
      }

      // Update the rate limit list - find and update existing or push new
      // First try exact match
      let updateResult = await UserModel.updateOne(
        {
          _id: this.currentUserId,
          'twitterRateLimits.endpoint': endpoint,
          'twitterRateLimits.method': method,
        },
        {
          $set: {
            'twitterRateLimits.$': rateLimitData,
          },
        }
      )

      // If no exact match found, try with normalized endpoint
      if (updateResult.matchedCount === 0) {
        const normalizedEndpoint = normalizeEndpoint(endpoint)

        // Find documents where the normalized endpoint matches
        const userRateLimits = await UserModel.findOne(
          { _id: this.currentUserId },
          { twitterRateLimits: 1 }
        ).lean()

        if (userRateLimits?.x_rate_limits) {
          const matchingIndex = userRateLimits.x_rate_limits.findIndex(
            (rl) =>
              normalizeEndpoint(rl.endpoint) === normalizedEndpoint &&
              rl.method === method
          )

          if (matchingIndex !== -1) {
            // Update using the positional $ operator with the found index
            await UserModel.updateOne(
              { _id: this.currentUserId },
              {
                $set: {
                  [`twitterRateLimits.${matchingIndex}`]: rateLimitData,
                },
              }
            )
            updateResult = {
              matchedCount: 1,
              modifiedCount: 1,
              upsertedCount: 0,
              upsertedId: null,
              acknowledged: true,
            }
          }
        }
      }

      // If we didn't update an existing record, add a new one
      if (updateResult.matchedCount === 0) {
        await UserModel.updateOne(
          { _id: this.currentUserId },
          {
            $push: {
              twitterRateLimits: rateLimitData,
            },
          }
        )
      }

      // Convert reset timestamp to date for logging
      const resetDate = new Date(rateLimit.reset * 1000)

      // Log with day limit info if available
      if (rateLimit.day) {
        const dayResetDate = new Date(rateLimit.day.reset * 1000)
        logger.info(
          `Stored rate limit in DB for ${endpoint}: ${rateLimit.remaining}/${rateLimit.limit} (resets at ${resetDate.toISOString()}), day limit: ${rateLimit.day.remaining}/${rateLimit.day.limit} (resets at ${dayResetDate.toISOString()})`
        )
      } else {
        logger.info(
          `Stored rate limit in DB for ${endpoint}: ${rateLimit.remaining}/${rateLimit.limit}, resets at ${resetDate.toISOString()}`
        )
      }
    } catch (error) {
      logger.error(
        `Failed to store rate limit in database: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
