import type { Context } from 'hono'
import { TwitterApi } from 'twitter-api-v2'

import { UserModel } from '@/mongo/user.mongo'
import type { Auth, User } from '@/types'

import { decryptToken, encryptToken } from '@/utils/server'
import { getOrigin, HTTPError } from '@/utils'

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
    this.callbackUrl = `${getOrigin()}/api/auth/callback`
  }

  //=============================================================================
  // OAUTH CONFIGURATION
  //=============================================================================

  /**
   * Generate Twitter OAuth URL with required scopes
   */
  generateAuthLink = () => {
    if (!this.client) {
      throw new HTTPError('Twitter client not initialized', 500)
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
  twitterLogin(c: Context) {
    // Generate auth URL and state for security
    const { url, codeVerifier, state } = this.generateAuthLink()

    // Initialize auth session if needed
    if (!c.req.session.auth) {
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
  async twitterCallback(c: Context) {
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
        throw new HTTPError('Twitter client not initialized', 500)
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
        twitterUsername: twitterUser.data.username,
        twitterDisplayName: twitterUser.data.name,
        twitterProfileImageUrl: twitterUser.data.profile_image_url,
        twitterAccessToken: encryptToken(accessToken),
        twitterRefreshToken: encryptToken(refreshToken),
        twitterAccessTokenExpiresAt: expiresAt,
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
      c.req.session.auth = {
        role: user.role,
        id: user._id.toString(),

        address: user.address,

        twitterUserId: user.twitterUserId,
        twitterUsername: user.twitterUsername,
        twitterDisplayName: user.twitterDisplayName,
        twitterProfileImageUrl: user.twitterProfileImageUrl,
        twitterAccessTokenExpiresAt: expiresAt,
      }

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
  async getCurrentUser(c: Context): Promise<Auth> {
    const session = c.req.session
    const { auth } = session

    // Check if user is authenticated
    if (!auth.twitterUserId) {
      throw new HTTPError('Not authenticated', 401)
    }

    let accessToken: string | null = null

    // Try to get a valid access token
    try {
      accessToken = await this.getAccessToken(auth.id)
    } catch {}

    // Destroy session if token is invalid or expired
    if (!accessToken) {
      c.req.session.destroy()
      throw new HTTPError('Session expired', 401)
    }

    // Verify user still exists in database
    const userExists = await UserModel.exists({ _id: auth.id })

    // Handle case where user was deleted
    if (!userExists) {
      c.req.session.destroy()
      throw new HTTPError('User not found', 404)
    }

    // Return user data from session
    return {
      id: auth.id,
      role: auth.role,

      twitterUserId: auth.twitterUserId,
      twitterUsername: auth.twitterUsername,
      twitterDisplayName: auth.twitterDisplayName,
      twitterProfileImageUrl: auth.twitterProfileImageUrl,
    }
  }

  /**
   * Logout user by destroying session
   */
  logout(c: Context) {
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
      'accessToken refreshToken tokenExpiresAt'
    )

    // Handle user not found
    if (!user) {
      throw new HTTPError('User not found', 404)
    }

    // Check if current token is still valid
    const now = new Date()
    if (
      user.twitterAccessTokenExpiresAt &&
      user.twitterAccessTokenExpiresAt > now
    ) {
      // Return existing token if not expired
      if (!user.twitterAccessToken) {
        throw new HTTPError('Access token not found', 404)
      }
      return decryptToken(user.twitterAccessToken)
    }

    // Ensure refresh token exists
    if (!user.twitterRefreshToken) {
      throw new HTTPError('Refresh token not found', 404)
    }

    // Decrypt stored refresh token
    const decryptedRefreshToken = decryptToken(user.twitterRefreshToken)

    // Use refresh token to get new access token
    try {
      if (!this.client) {
        throw new HTTPError('Twitter client not initialized', 500)
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
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
      })

      // Return the access token
      return accessToken
    } catch (error: any) {
      throw new HTTPError(
        `[userId: ${userId}] Failed to refresh access token ~ errorMessage: ${error?.message ?? 'Unknown error message'}`,
        500
      )
    }
  }
}
