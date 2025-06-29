import { logger } from '@/utils'
import type {
  ITwitterApiRateLimitGetArgs,
  ITwitterApiRateLimitSetArgs,
  ITwitterApiRateLimitStore,
} from '@twitter-api-v2/plugin-rate-limit'
import { model, Schema } from 'mongoose'
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

// ----------------------------------------------------------------------------
// SCHEMA DEFINITIONS

// Schema for the SingleTwitterRateLimit structure (used in main and day limits)
const SingleTwitterRateLimitSchema = {
  limit: {
    type: Number,
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
  reset: {
    type: Number, // Unix timestamp in seconds
    required: true,
  },
}

// Schema for the rate limit document
const TwitterRateLimitDocumentSchema = new Schema(
  {
    // User reference
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    // Standard rate limit fields
    ...SingleTwitterRateLimitSchema,

    // Day limit fields (nested SingleTwitterRateLimit)
    day: {
      type: SingleTwitterRateLimitSchema,
      required: false,
    },

    // Context fields
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      default: 'GET',
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Create compound index for efficient lookups
TwitterRateLimitDocumentSchema.index({ user_id: 1, endpoint: 1, method: 1 })

// Create the model
const TwitterRateLimitModel = model(
  'twitter_rate_limits',
  TwitterRateLimitDocumentSchema
)

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS

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

// ----------------------------------------------------------------------------
// STORE IMPLEMENTATION

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
      // Normalize the requested endpoint for comparison
      const normalizedRequestEndpoint = normalizeEndpoint(args.endpoint)
      const method = args.method || 'GET'

      // Try to find the specific endpoint in the rate limits collection
      // First try exact match
      let rateLimitDoc = await TwitterRateLimitModel.findOne({
        user_id: this.currentUserId,
        endpoint: args.endpoint,
        method: method,
      }).lean()

      // If exact match failed, try with normalized endpoints
      if (!rateLimitDoc) {
        // Find all rate limits for this user and check normalized endpoints
        const userRateLimits = await TwitterRateLimitModel.find({
          user_id: this.currentUserId,
          method: method,
        }).lean()

        rateLimitDoc =
          userRateLimits.find(
            (rl) => normalizeEndpoint(rl.endpoint) === normalizedRequestEndpoint
          ) || null
      }

      if (rateLimitDoc && rateLimitDoc.reset) {
        // Convert reset timestamp to milliseconds for comparison
        const resetTimeMs = rateLimitDoc.reset * 1000

        // Check if day limit is reached
        const isDayLimited =
          rateLimitDoc.day?.remaining === 0 &&
          rateLimitDoc.day?.reset &&
          rateLimitDoc.day.reset * 1000 > Date.now()

        // Check if standard limit is reached
        const isStandardLimited =
          Date.now() < resetTimeMs && rateLimitDoc.remaining === 0

        // If either limit is still active, return the rate limit info
        if (isStandardLimited || isDayLimited) {
          // Create the API rate limit object
          const apiRateLimit: TwitterApiRateLimit = {
            limit: rateLimitDoc.limit,
            remaining: rateLimitDoc.remaining,
            reset: rateLimitDoc.reset,
          }

          // Add day limit info if available
          if (rateLimitDoc.day) {
            apiRateLimit.day = {
              limit: rateLimitDoc.day.limit,
              remaining: rateLimitDoc.day.remaining,
              reset: rateLimitDoc.day.reset,
            }
          }

          if (isDayLimited && rateLimitDoc.day) {
            logger.info(
              `Retrieved rate limit from database for ${args.endpoint}: Day limit reached, resets at ${new Date(rateLimitDoc.day.reset * 1000).toISOString()}`
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
      // Create rate limit data
      const rateLimitData = {
        // User reference
        user_id: this.currentUserId,

        // Twitter API fields
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,

        // Day limit fields if available
        ...(rateLimit.day && { day: rateLimit.day }),

        // Context fields
        endpoint: endpoint,
        method: method,
        last_updated: new Date(),
      }

      // Upsert the rate limit document
      await TwitterRateLimitModel.findOneAndUpdate(
        {
          user_id: this.currentUserId,
          endpoint: endpoint,
          method: method,
        },
        rateLimitData,
        {
          upsert: true,
          new: true,
        }
      )

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

  /**
   * Clean up expired rate limits for a user (optional maintenance method)
   */
  async cleanupExpired(): Promise<void> {
    if (!this.currentUserId) {
      return
    }

    try {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds

      await TwitterRateLimitModel.deleteMany({
        user_id: this.currentUserId,
        reset: { $lt: now },
        $or: [{ day: { $exists: false } }, { 'day.reset': { $lt: now } }],
      })

      logger.info(
        `Cleaned up expired rate limits for user ${this.currentUserId}`
      )
    } catch (error) {
      logger.error(
        `Failed to clean up expired rate limits: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
