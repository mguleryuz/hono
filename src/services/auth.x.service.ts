import { UserModel } from '@/mongo/user.mongo'
import type { User } from '@/schemas'
import type { GetCleanSuccessType } from '@/types'
import { getOrigin } from '@/utils'
import { decryptToken, encryptToken } from '@/utils/server'
import debug from 'debug'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { TwitterApi } from 'twitter-api-v2'

const d = debug('auth.x.service')

// Schema type imports
type TwitterSessionType = GetCleanSuccessType<'auth-x', 'session'>
type LogoutResponseType = GetCleanSuccessType<'auth-x', 'logout'>

/**
 * Service handling Twitter OAuth authentication flow and user session management
 */
export class AuthXService {
  private readonly client: TwitterApi | undefined
  private readonly callbackUrl: string

  /**
   * Initialize the AuthService with a Twitter API client
   */
  constructor(client: TwitterApi | undefined) {
    if (client) this.client = client
    this.callbackUrl = `${getOrigin()}/api/auth/x/callback`
  }

  //=============================================================================
  // OAUTH CONFIGURATION
  //=============================================================================

  /**
   * Generate Twitter OAuth URL with required scopes
   */
  generateAuthLink = () => {
    if (!this.client) {
      d('Twitter client not initialized')
      throw new HTTPException(500, {
        message: 'Twitter client not initialized',
      })
    }

    return this.client.generateOAuth2AuthLink(this.callbackUrl, {
      scope: [
        'tweet.read',
        'users.read',
        'offline.access',
        'follows.read',
        'like.read',
      ],
      // Request user's email if your app has permission
      // X requires special approval for email scope
    })
  }

  //=============================================================================
  // AUTHENTICATION FLOW
  //=============================================================================

  /**
   * Initiate Twitter OAuth flow by redirecting user to Twitter login
   */
  login(c: Context) {
    // Generate auth URL and state for security
    const { url, codeVerifier, state } = this.generateAuthLink()

    // Get returnTo parameter from query string
    const returnTo = c.req.query('returnTo')

    // Store verification data in session for callback verification
    c.req.session.twitterCodeVerifier = codeVerifier
    c.req.session.twitterState = state

    // Store the returnTo URL for redirecting after successful authentication
    if (returnTo) {
      c.req.session.returnTo = returnTo
    }

    // Redirect the user to the Twitter auth URL
    return c.redirect(url)
  }

  /**
   * Handle callback from Twitter OAuth and create/update user session
   */
  async callback(c: Context) {
    const { code, state } = c.req.query()

    // Get the returnTo URL from session for error redirects
    const returnTo = c.req.session.returnTo || '/'

    // Verify state parameter to prevent CSRF attacks
    if (state !== c.req.session.twitterState) {
      console.error('Invalid state parameter')
      // Clean up session and redirect
      delete c.req.session.returnTo
      return c.redirect(returnTo)
    }

    // Handle case when user canceled authentication
    if (!code) {
      // Clean up session and redirect
      delete c.req.session.returnTo
      return c.redirect(returnTo)
    }

    try {
      if (!this.client) {
        d('Twitter client not initialized')
        throw new HTTPException(500, {
          message: 'Twitter client not initialized',
        })
      }

      // Exchange authorization code for access tokens
      const { client, accessToken, refreshToken, expiresIn } =
        await this.client.loginWithOAuth2({
          code,
          codeVerifier: c.req.session.twitterCodeVerifier!,
          redirectUri: this.callbackUrl,
        })

      // Fetch user profile information from Twitter
      const twitterUser = await client.v2.me({
        'user.fields': ['profile_image_url', 'username', 'name', 'description'],
      })

      // Calculate token expiration timestamp
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

      // Prepare user data for database storage
      const userData: Partial<User> = {
        x_username: twitterUser.data.username,
        x_bio: twitterUser.data.description,
        x_display_name: twitterUser.data.name,
        x_profile_image_url: twitterUser.data.profile_image_url,
        x_access_token: encryptToken(accessToken),
        x_refresh_token: encryptToken(refreshToken),
        x_access_token_expires_at: expiresAt,
      }

      // Upsert user in database - update if exists, create if new
      const user = await UserModel.findOneAndUpdate(
        { x_user_id: twitterUser.data.id },
        {
          $set: {
            ...userData,
          },
          $setOnInsert: { x_user_id: twitterUser.data.id },
        },
        { new: true, upsert: true }
      ).lean()

      if (!user) {
        throw new Error('Failed to create/update user')
      }

      // Set up user session with necessary authentication data
      Object.assign(c.req.session, {
        mongo_id: user._id.toString(),
        role: user.role,

        // X data
        x_user_id: twitterUser.data.id,
        x_username: user.x_username,
        x_bio: user.x_bio,
        x_display_name: user.x_display_name,
        x_profile_image_url: user.x_profile_image_url,
        x_access_token_expires_at: expiresAt,

        // EVM data (if exists)
        address: user.address,
      })

      // Set a longer session duration (30 days) instead of using Twitter's expiration time
      // This works because we can refresh the token when needed
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      c.req.session.cookie.maxAge = maxAge

      d(
        `Saved user session, with maxAge: ${maxAge / 1000 / 60 / 60 / 24} in days, ${c.req.session}`
      )

      // Get the returnTo URL from session, default to homepage if not set
      const returnTo = c.req.session.returnTo || '/'

      // Clean up the returnTo from session
      delete c.req.session.returnTo

      // Redirect to the stored URL or homepage after successful authentication
      return c.redirect(returnTo)
    } catch (error) {
      console.error('Twitter auth error:', error)
      // Clean up session and gracefully handle errors by redirecting to returnTo URL
      delete c.req.session.returnTo
      return c.redirect(returnTo)
    }
  }

  //=============================================================================
  // USER SESSION MANAGEMENT
  //=============================================================================
  /**
   * Get current authenticated user information from session
   */
  async getSession(c: Context): Promise<TwitterSessionType> {
    const session = c.req.session

    // Check if user is authenticated
    if (!session.twitterUserId) {
      d('User is not authenticated')
      throw new HTTPException(401, {
        message: 'Not authenticated',
      })
    }

    let accessToken: string | null = null

    // Try to get a valid access token
    try {
      accessToken = await this.getAccessToken(session.mongo_id as string)
    } catch {}

    // Destroy session if token is invalid or expired
    if (!accessToken) {
      d('Destroying session')
      c.req.session.destroy()
      throw new HTTPException(401, {
        message: 'Session expired',
      })
    }

    // Verify user still exists in database
    const userExists = await UserModel.exists({ _id: session.mongo_id })

    // Handle case where user was deleted
    if (!userExists) {
      c.req.session.destroy()
      throw new HTTPException(404, {
        message: 'User not found',
      })
    }

    const twitterRateLimits = await UserModel.findById(session.mongo_id, {
      twitterRateLimits: 1,
    }).lean()

    // Return user data from session matching schema
    return {
      mongo_id: session.mongo_id!,
      role: session.role!,
      x_user_id: session.x_user_id,
      x_username: session.x_username,
      x_display_name: session.x_display_name,
      x_profile_image_url: session.x_profile_image_url,
      status: 'authenticated',
    }
  }
  /**
   * Logout user by destroying session
   */
  logout(c: Context): LogoutResponseType {
    c.req.session.destroy()
    return { success: true }
  }

  //=============================================================================
  // TOKEN MANAGEMENT
  //=============================================================================

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(userId: string): Promise<string> {
    // Find user in database with token information
    const user = await UserModel.findById(
      userId,
      'x_access_token x_refresh_token x_access_token_expires_at'
    )

    d('Got user for fresh access token')

    // Handle user not found
    if (!user) {
      d('User not found')
      throw new HTTPException(404, {
        message: 'User not found',
      })
    }

    // Check if current token is still valid
    const now = new Date()
    if (
      user.x_access_token_expires_at &&
      user.x_access_token_expires_at > now
    ) {
      // Return existing token if not expired
      if (!user.x_access_token) {
        d('Access token not found')
        throw new HTTPException(404, {
          message: 'Access token not found',
        })
      }

      d('Returning existing token')
      return decryptToken(user.x_access_token as string)
    }

    // Ensure refresh token exists
    if (!user.x_refresh_token) {
      d('Refresh token not found')
      throw new HTTPException(404, {
        message: 'Refresh token not found',
      })
    }

    // Decrypt stored refresh token
    const decryptedRefreshToken = decryptToken(user.x_refresh_token as string)

    // Use refresh token to get new access token
    try {
      if (!this.client) {
        d('Twitter client not initialized')
        throw new HTTPException(500, {
          message: 'Twitter client not initialized',
        })
      }

      // Exchange refresh token for new tokens
      const { accessToken, refreshToken, expiresIn } =
        await this.client.refreshOAuth2Token(decryptedRefreshToken)

      // Calculate new expiration time
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

      // Encrypt tokens for secure storage
      const encryptedAccessToken = encryptToken(accessToken)
      const encryptedRefreshToken = encryptToken(refreshToken)

      // Update user record with new token information
      await UserModel.findByIdAndUpdate(userId, {
        x_access_token: encryptedAccessToken,
        x_refresh_token: encryptedRefreshToken,
        x_access_token_expires_at: expiresAt,
      })

      // Return the access token
      return accessToken
    } catch (error: any) {
      d('Failed to refresh access token', error)
      throw new HTTPException(500, {
        message: `Error refreshing access token for user ${userId}, error: ${error?.message ?? 'Unknown error message'}`,
      })
    }
  }
}
