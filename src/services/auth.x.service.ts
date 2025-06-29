import { UserModel } from '@/mongo/user.mongo'
import type { GetCleanSuccessType, User } from '@/types'
import { getOrigin } from '@/utils'
import { decryptToken, encryptToken } from '@/utils/server'
import debug from 'debug'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { TwitterApi } from 'twitter-api-v2'

const d = debug('auth.x.service')

// Schema type imports
type TwitterSessionType = GetCleanSuccessType<'twitterAuth', 'session'>
type LogoutResponseType = GetCleanSuccessType<'twitterAuth', 'logout'>

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
        'dm.write',
        'tweet.write',
        'like.write',
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

    // Initialize auth session if needed
    if (!c.req.session.auth) {
      d('Auth session not initialized')
      c.req.session.auth = {} as any
    }

    // Store verification data in session for callback verification
    c.req.session.auth.twitterCodeVerifier = codeVerifier
    c.req.session.auth.twitterState = state

    // Redirect the user to the Twitter auth URL
    return c.redirect(url)
  }

  /**
   * Handle callback from Twitter OAuth and create/update user session
   */
  async callback(c: Context) {
    const { code, state } = c.req.query()

    // Verify state parameter to prevent CSRF attacks
    if (state !== c.req.session.auth.twitterState) {
      console.error('Invalid state parameter')
      return c.redirect('/')
    }

    // Handle case when user canceled authentication
    if (!code) {
      return c.redirect('/')
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
          codeVerifier: c.req.session.auth.twitterCodeVerifier!,
          redirectUri: this.callbackUrl,
        })

      // Fetch user profile information from Twitter
      const twitterUser = await client.v2.me({
        'user.fields': ['profile_image_url', 'username', 'name'],
      })

      // Calculate token expiration timestamp
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

      // Prepare user data for database storage
      const userData: Partial<User> = {
        twitter_username: twitterUser.data.username,
        twitter_display_name: twitterUser.data.name,
        twitter_profile_image_url: twitterUser.data.profile_image_url,
        twitter_access_token: encryptToken(accessToken),
        twitter_refresh_token: encryptToken(refreshToken),
        twitter_access_token_expires_at: expiresAt,
        address: undefined,
      }

      // Upsert user in database - update if exists, create if new
      const user = await UserModel.findOneAndUpdate(
        { twitterUserId: twitterUser.data.id },
        {
          $set: userData,
          $setOnInsert: { twitterUserId: twitterUser.data.id },
        },
        { new: true, upsert: true }
      )

      // Set up user session with necessary authentication data
      Object.assign(c.req.session, {
        role: user.role,
        id: user._id.toString(),

        address: user.address,

        twitter_user_id: user.twitter_user_id,
        twitter_username: user.twitter_username,
        twitter_display_name: user.twitter_display_name,
        twitter_profile_image_url: user.twitter_profile_image_url,
        twitter_access_token_expires_at: expiresAt,
      })

      // Set a longer session duration (30 days) instead of using Twitter's expiration time
      // This works because we can refresh the token when needed
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      c.req.session.cookie.maxAge = maxAge

      d(
        `Saved user session.auth, with maxAge: ${maxAge / 1000 / 60 / 60 / 24} in days, ${c.req.session.auth}`
      )

      // Redirect to homepage after successful authentication
      return c.redirect('/')
    } catch (error) {
      console.error('Twitter auth error:', error)
      // Gracefully handle errors by redirecting to homepage
      return c.redirect('/')
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
    const { auth } = session

    d('Current user session.auth', auth)

    // Check if user is authenticated
    if (!auth.twitterUserId) {
      d('User is not authenticated')
      throw new HTTPException(401, {
        message: 'Not authenticated',
      })
    }

    let accessToken: string | null = null

    // Try to get a valid access token
    try {
      accessToken = await this.getAccessToken(auth.id)
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
    const userExists = await UserModel.exists({ _id: auth.id })

    // Handle case where user was deleted
    if (!userExists) {
      c.req.session.destroy()
      throw new HTTPException(404, {
        message: 'User not found',
      })
    }

    const twitterRateLimits = await UserModel.findById(auth.id, {
      twitterRateLimits: 1,
    }).lean()

    // Return user data from session matching schema
    return {
      mongo_id: auth.id,
      role: auth.role,
      twitter_user_id: auth.twitter_user_id,
      twitter_username: auth.twitter_username,
      twitter_display_name: auth.twitter_display_name,
      twitter_profile_image_url: auth.twitter_profile_image_url,
      twitter_rate_limits: twitterRateLimits?.twitter_rate_limits ?? [],
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
      'twitterAccessToken twitterRefreshToken twitterAccessTokenExpiresAt'
    )

    d('Got user for fresh access token', user)

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
      user.twitter_access_token_expires_at &&
      user.twitter_access_token_expires_at > now
    ) {
      // Return existing token if not expired
      if (!user.twitter_access_token) {
        d('Access token not found')
        throw new HTTPException(404, {
          message: 'Access token not found',
        })
      }

      d('Returning existing token')
      return decryptToken(user.twitter_access_token)
    }

    // Ensure refresh token exists
    if (!user.twitter_refresh_token) {
      d('Refresh token not found')
      throw new HTTPException(404, {
        message: 'Refresh token not found',
      })
    }

    // Decrypt stored refresh token
    const decryptedRefreshToken = decryptToken(user.twitter_refresh_token)

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
        twitterAccessToken: encryptedAccessToken,
        twitterRefreshToken: encryptedRefreshToken,
        twitterAccessTokenExpiresAt: expiresAt,
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
