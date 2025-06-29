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
    // User reference - optional for app-level rate limits
    user_id: {
      type: String,
      required: false,
      index: true,
      default: null,
    },

    // Flag to indicate if this is an app-level rate limit
    is_app_level: {
      type: Boolean,
      required: false,
      default: false,
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

// Create compound indexes for efficient lookups
TwitterRateLimitDocumentSchema.index({ user_id: 1, endpoint: 1, method: 1 })
TwitterRateLimitDocumentSchema.index({
  is_app_level: 1,
  endpoint: 1,
  method: 1,
})

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
  private isAppLevel: boolean

  /**
   * Initialize store with a specific user ID or for app-level rate limiting
   * @param currentUserId - User ID for user-specific rate limits, or undefined for app-level
   */
  constructor(private currentUserId?: string) {
    this.isAppLevel = currentUserId === 'APP' || currentUserId === undefined

    if (this.isAppLevel) {
      logger.info(
        'Initialized Twitter rate limit store for app-level rate limiting'
      )
    } else {
      logger.info(
        `Initialized Twitter rate limit store for user ${currentUserId}`
      )
    }
  }

  /**
   * Set the current user ID that will be used for storing rate limits
   */
  setCurrentUserId(userId: string) {
    this.currentUserId = userId
    this.isAppLevel = false
  }

  /**
   * Get the rate limit for a specific endpoint
   */
  async get(
    args: ITwitterApiRateLimitGetArgs
  ): Promise<TwitterApiRateLimit | undefined> {
    // Only check database if we have endpoint
    if (!args.endpoint) {
      return undefined
    }

    // For app-level, we don't need a user ID
    if (!this.isAppLevel && !this.currentUserId) {
      return undefined
    }

    try {
      // Normalize the requested endpoint for comparison
      const normalizedRequestEndpoint = normalizeEndpoint(args.endpoint)
      const method = args.method || 'GET'

      // Build query based on whether this is app-level or user-specific
      const query = this.isAppLevel
        ? {
            is_app_level: true,
            endpoint: args.endpoint,
            method: method,
          }
        : {
            user_id: this.currentUserId,
            is_app_level: { $ne: true },
            endpoint: args.endpoint,
            method: method,
          }

      // Try to find the specific endpoint in the rate limits collection
      let rateLimitDoc = await TwitterRateLimitModel.findOne(query).lean()

      // If exact match failed, try with normalized endpoints
      if (!rateLimitDoc) {
        const allQuery = this.isAppLevel
          ? {
              is_app_level: true,
              method: method,
            }
          : {
              user_id: this.currentUserId,
              is_app_level: { $ne: true },
              method: method,
            }

        const rateLimits = await TwitterRateLimitModel.find(allQuery).lean()

        rateLimitDoc =
          rateLimits.find(
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

    // For user-specific rate limits, we need a user ID
    if (!this.isAppLevel && !this.currentUserId) {
      return
    }

    try {
      // Create rate limit data based on whether this is app-level or user-specific
      const rateLimitData = {
        // User reference (null for app-level)
        user_id: this.isAppLevel ? null : this.currentUserId,
        is_app_level: this.isAppLevel,

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

      // Build query based on whether this is app-level or user-specific
      const query = this.isAppLevel
        ? {
            is_app_level: true,
            endpoint: endpoint,
            method: method,
          }
        : {
            user_id: this.currentUserId,
            endpoint: endpoint,
            method: method,
          }

      // Upsert the rate limit document
      await TwitterRateLimitModel.findOneAndUpdate(query, rateLimitData, {
        upsert: true,
        new: true,
      })

      // Convert reset timestamp to date for logging
      const resetDate = new Date(rateLimit.reset * 1000)

      // Log with day limit info if available
      const identifier = this.isAppLevel ? 'app' : `user ${this.currentUserId}`
      if (rateLimit.day) {
        const dayResetDate = new Date(rateLimit.day.reset * 1000)
        logger.info(
          `Stored rate limit in DB for ${identifier} - ${endpoint}: ${rateLimit.remaining}/${rateLimit.limit} (resets at ${resetDate.toISOString()}), day limit: ${rateLimit.day.remaining}/${rateLimit.day.limit} (resets at ${dayResetDate.toISOString()})`
        )
      } else {
        logger.info(
          `Stored rate limit in DB for ${identifier} - ${endpoint}: ${rateLimit.remaining}/${rateLimit.limit}, resets at ${resetDate.toISOString()}`
        )
      }
    } catch (error) {
      logger.error(
        `Failed to store rate limit in database: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Clean up expired rate limits (optional maintenance method)
   */
  async cleanupExpired(): Promise<void> {
    // For user-specific rate limits, we need a user ID
    if (!this.isAppLevel && !this.currentUserId) {
      return
    }

    try {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds

      const query = this.isAppLevel
        ? {
            is_app_level: true,
            reset: { $lt: now },
            $or: [{ day: { $exists: false } }, { 'day.reset': { $lt: now } }],
          }
        : {
            user_id: this.currentUserId,
            reset: { $lt: now },
            $or: [{ day: { $exists: false } }, { 'day.reset': { $lt: now } }],
          }

      await TwitterRateLimitModel.deleteMany(query)

      const identifier = this.isAppLevel ? 'app' : `user ${this.currentUserId}`
      logger.info(`Cleaned up expired rate limits for ${identifier}`)
    } catch (error) {
      logger.error(
        `Failed to clean up expired rate limits: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
