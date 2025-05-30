import { getSocialDataToolsApiKey, logger } from '@/utils'

import { formatTwitterDateString } from './twitter.service'
import type {
  SocialDataActiveMonitorsResponse,
  SocialDataSearchResponse,
  SocialDataTweet,
  SocialDataUserTweetsMonitorResponse,
  TwitterSearchQuery,
} from './types'

export class SocialDataService {
  private readonly apiKey: string | undefined

  constructor() {
    this.apiKey = getSocialDataToolsApiKey()
  }

  /**
   * Search for tweets using Social Data Tools API
   * @param query Search query string or TwitterSearchQuery object
   * @param type Search type (Latest, Top, etc.)
   * @param cursor Cursor for pagination
   * @returns Search results
   */
  async searchTweets(
    query: string | TwitterSearchQuery,
    type: 'Latest' | 'Top' = 'Latest',
    cursor?: string
  ): Promise<SocialDataSearchResponse> {
    const queryString =
      typeof query === 'string' ? query : buildTwitterSearchQuery(query)

    const params: Record<string, string> = {
      query: queryString,
      type,
    }

    if (cursor) {
      params.cursor = cursor
    }

    try {
      logger.info(`Searching tweets with query: ${queryString}`)
      const data = await this.apiFetch<'GET', SocialDataSearchResponse>(
        'GET',
        `/twitter/search?query=${encodeURIComponent(queryString)}&type=${type}`,
        params
      )
      logger.info(
        `Retrieved ${data.tweets?.length || 0} tweets from Social Data API`
      )
      return data
    } catch (error) {
      logger.error(
        `Error searching tweets: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      return { tweets: [] }
    }
  }

  /**
   * Get a tweet by ID
   */
  async getTweetById(tweetId: string): Promise<SocialDataTweet | null> {
    try {
      const data = await this.apiFetch<'GET', SocialDataTweet>(
        'GET',
        `/twitter/tweets/${tweetId}`
      )
      logger.info(
        `Retrieved tweet by username: ${data.user.screen_name}, start of tweet: ${data.full_text.slice(0, 50)}`
      )
      return data
    } catch (error) {
      logger.error(
        `Error getting tweet by ID: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    }
  }

  /**
   * Get comments of a tweet
   * @param tweetId Tweet ID
   * @returns Comments
   */
  async getCommentsOfTweet(
    tweetId: string,
    cursor?: string
  ): Promise<SocialDataSearchResponse> {
    try {
      logger.info(`Getting comments of tweet: ${tweetId}`)
      const data = await this.apiFetch<'GET', SocialDataSearchResponse>(
        'GET',
        `/twitter/tweets/${tweetId}/comments`,
        cursor ? { params: { cursor } } : {}
      )
      logger.info(
        `Retrieved ${data.tweets?.length || 0} comments from Social Data API`
      )
      return data
    } catch (error) {
      logger.error(
        `Error getting comments of tweet: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      return { tweets: [] }
    }
  }

  /**
   * Create a user tweets monitor
   * @param userScreenName User screen name
   * @param webhookUrl Webhook URL
   * @returns Monitor response
   */
  async createUserTweetsMonitor(
    userScreenName: string,
    webhookUrl: string
  ): Promise<SocialDataUserTweetsMonitorResponse> {
    try {
      const data = await this.apiFetch<
        'POST',
        SocialDataUserTweetsMonitorResponse
      >('POST', '/monitors/user-tweets', {
        data: { user_screen_name: userScreenName, webhook_url: webhookUrl },
      })

      type SuccessResponse = Extract<
        SocialDataUserTweetsMonitorResponse,
        { status: 'success' }
      >

      logger.info(
        `Created user tweets monitor: username ${(data as SuccessResponse).data.parameters.user_screen_name}, monitor id ${(data as SuccessResponse).data.id}`
      )
      return data
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error(`Error creating user tweets monitor: ${errorMessage}`)
      return {
        status: 'error',
        message: errorMessage,
      }
    }
  }

  /**
   * Get active monitors, retreiving all pages
   * @param page Page number @default 1
   * @returns Active monitors
   */
  async getActiveMonitors(
    page: number = 1
  ): Promise<SocialDataActiveMonitorsResponse> {
    try {
      const data = await this.apiFetch<'GET', SocialDataActiveMonitorsResponse>(
        'GET',
        `/monitors?page=${page}`
      )

      if (data.meta.page < data.meta.last_page) {
        const nextPage = data.meta.page + 1
        const nextPageData = await this.getActiveMonitors(nextPage)
        return {
          ...data,
          data: [...data.data, ...nextPageData.data],
        }
      }

      return data
    } catch (error) {
      logger.error(
        `Error getting active monitors: ${error instanceof Error ? error.message : String(error)}`
      )
      return {
        data: [],
        meta: { page: 1, last_page: 1, items_count: 0 },
      }
    }
  }

  /**
   * Delete a monitor
   * @param id Monitor ID
   * @returns void
   */
  async deleteMonitor(id: string): Promise<void> {
    await this.apiFetch<'DELETE', void>('DELETE', `/monitors/${id}`)
    logger.info(`Deleted monitor: ${id}`)
    return
  }

  /**
   * Patch a monitor
   * @param id Monitor ID
   * @param data Monitor data
   * @returns SocialDataUserTweetsMonitorResponse
   */
  async patchMonitor(
    id: string,
    data: { webhook_url: string }
  ): Promise<SocialDataUserTweetsMonitorResponse> {
    const response = await this.apiFetch<
      'PATCH',
      SocialDataUserTweetsMonitorResponse
    >('PATCH', `/monitors/${id}`, { data })

    logger.info(`Patched monitor: ${id}`)
    return response
  }

  /**
   * Dynamic fetch handler for Social Data Tools API
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param options Request options (params for GET, data for POST/PATCH, id for DELETE)
   * @returns Response data based on method type
   */
  private async apiFetch<
    M extends 'GET' | 'POST' | 'DELETE' | 'PATCH',
    T = M extends 'DELETE' ? void : any,
  >(
    method: M,
    endpoint: string,
    options?: M extends 'GET'
      ? { params?: Record<string, string> }
      : M extends 'POST' | 'PATCH'
        ? { data: Record<string, any> }
        : M extends 'DELETE'
          ? { id?: string }
          : never
  ): Promise<T> {
    const baseUrl = 'https://api.socialdata.tools'
    let url = new URL(`${baseUrl}${endpoint}`)

    // Handle GET parameters
    if (method === 'GET' && options && 'params' in options) {
      Object.entries(options.params || {}).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    logger.info(`Making ${method} API request to ${url.pathname}`)

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }

      // Add content-type and body for POST and PATCH requests
      if (
        (method === 'POST' || method === 'PATCH') &&
        options &&
        'data' in options
      ) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/json',
        }
        requestOptions.body = JSON.stringify(options.data)
      }

      // Handle Accept header for GET requests
      if (method === 'GET') {
        requestOptions.headers = {
          ...requestOptions.headers,
          Accept: 'application/json',
        }
      }

      const response = await fetch(url.toString(), requestOptions)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Social Data API error: ${response.status} - ${errorText}`)
        throw new Error(
          `Social Data API error: ${response.status} - ${errorText}`
        )
      }

      // For DELETE requests, return void
      if (method === 'DELETE') {
        return undefined as T
      }

      // For GET, POST and PATCH, return JSON response
      return (await response.json()) as T
    } catch (error) {
      logger.error(
        `API error: ${error instanceof Error ? error.message : String(error)}`
      )
      throw error
    }
  }
}

/**
 * Builds a Twitter search query string from a TwitterSearchQuery object
 */
export function buildTwitterSearchQuery(query: TwitterSearchQuery): string {
  const parts: string[] = []

  // Add text if provided
  if (query.text) {
    parts.push(query.text)
  }

  // User filters
  if (query.from) {
    const fromUsers = Array.isArray(query.from) ? query.from : [query.from]
    fromUsers.forEach((user) => parts.push(`from:${user}`))
  }

  if (query.to) {
    const toUsers = Array.isArray(query.to) ? query.to : [query.to]
    toUsers.forEach((user) => parts.push(`to:${user}`))
  }

  if (query.mentions) {
    const mentionUsers = Array.isArray(query.mentions)
      ? query.mentions
      : [query.mentions]
    mentionUsers.forEach((user) => parts.push(`@${user}`))
  }

  if (query.list) {
    parts.push(`list:${query.list}`)
  }

  if (query.blueVerified) {
    parts.push('filter:blue_verified')
  }

  // Tweet type filters
  if (query.onlyRetweets) {
    parts.push('filter:nativeretweets')
  } else if (query.includeRetweets) {
    parts.push('include:nativeretweets')
  }

  if (query.onlyReplies) {
    parts.push('filter:replies')
  }

  if (query.selfThreads) {
    parts.push('filter:self_threads')
  }

  if (query.conversationId) {
    parts.push(`conversation_id:${query.conversationId}`)
  }

  if (query.onlyQuotes) {
    parts.push('filter:quote')
  }

  if (query.quotedTweetId) {
    parts.push(`quoted_tweet_id:${query.quotedTweetId}`)
  }

  if (query.quotedUserId) {
    parts.push(`quoted_user_id:${query.quotedUserId}`)
  }

  // Date & Time filters
  if (query.since) {
    parts.push(`since:${formatTwitterDateString(query.since)}`)
  }

  if (query.until) {
    parts.push(`until:${formatTwitterDateString(query.until)}`)
  }

  if (query.sinceTime) {
    parts.push(`since_time:${query.sinceTime}`)
  }

  if (query.untilTime) {
    parts.push(`until_time:${query.untilTime}`)
  }

  if (query.sinceId) {
    parts.push(`since_id:${query.sinceId}`)
  }

  if (query.maxId) {
    parts.push(`max_id:${query.maxId}`)
  }

  if (query.withinTime) {
    parts.push(`within_time:${query.withinTime}`)
  }

  // Content filters
  if (query.url) {
    parts.push(`url:${query.url}`)
  }

  if (query.language) {
    parts.push(`lang:${query.language}`)
  }

  // Geo filters
  if (query.near) {
    parts.push(`near:${query.near}`)
  }

  if (query.within) {
    parts.push(`within:${query.within}`)
  }

  if (query.geocode) {
    parts.push(`geocode:${query.geocode}`)
  }

  if (query.place) {
    parts.push(`place:${query.place}`)
  }

  // Engagement filters
  if (query.hasEngagement) {
    parts.push('filter:has_engagement')
  }

  if (query.minRetweets !== undefined) {
    parts.push(`min_retweets:${query.minRetweets}`)
  }

  if (query.maxRetweets !== undefined) {
    parts.push(`-min_retweets:${query.maxRetweets}`)
  }

  if (query.minLikes !== undefined) {
    parts.push(`min_faves:${query.minLikes}`)
  }

  if (query.maxLikes !== undefined) {
    parts.push(`-min_faves:${query.maxLikes}`)
  }

  if (query.minReplies !== undefined) {
    parts.push(`min_replies:${query.minReplies}`)
  }

  if (query.maxReplies !== undefined) {
    parts.push(`-min_replies:${query.maxReplies}`)
  }

  // Media filters
  if (query.media) {
    parts.push('filter:media')
  }

  if (query.images) {
    parts.push('filter:images')
  }

  if (query.videos) {
    parts.push('filter:videos')
  }

  if (query.nativeVideo) {
    parts.push('filter:native_video')
  }

  if (query.links) {
    parts.push('filter:links')
  }

  if (query.spaces) {
    parts.push('filter:spaces')
  }

  if (query.news) {
    parts.push('filter:news')
  }

  if (query.safe) {
    parts.push('filter:safe')
  }

  if (query.hashtags) {
    parts.push('filter:hashtags')
  }

  return parts.join(' ')
}
