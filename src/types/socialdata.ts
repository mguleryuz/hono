export interface SocialDataNewTweetEvent {
  event: string
  data: SocialDataTweet
  meta: {
    monitor_id: string
    monitor_type: string
    monitored_id_str: string
    monitored_username: string
  }
}

export interface SocialDataTweet {
  /**
   * Twitter's ISO 8601 format with microseconds: YYYY-MM-DDTHH:mm:ss.SSSSSSZ
   */
  tweet_created_at: string
  id: number
  id_str: string
  community_id_str: string | null
  community_name: string | null
  conversation_id_str: string | null
  text: string | null
  full_text: string
  source: string
  truncated: boolean
  in_reply_to_status_id: number | null
  in_reply_to_status_id_str: string | null
  in_reply_to_user_id: number | null
  in_reply_to_user_id_str: string | null
  in_reply_to_screen_name: string | null
  user: SocialDataUser
  quoted_status_id: number | null
  quoted_status_id_str: string | null
  is_quote_status: boolean
  quoted_status: SocialDataTweet | null
  retweeted_status: SocialDataTweet | null
  quote_count: number
  reply_count: number
  retweet_count: number
  favorite_count: number
  views_count: number | null
  bookmark_count: number
  lang: string
  entities: SocialDataTweetEntities
  is_pinned: boolean
}

export interface SocialDataMedia {
  display_url: string
  expanded_url: string
  id_str: string
  indices: Array<number>
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: {
    status: string
  }
  features: {
    large: {
      faces: Array<{
        x: number
        y: number
        h: number
        w: number
      }>
    }
    medium: {
      faces: Array<{
        x: number
        y: number
        h: number
        w: number
      }>
    }
    small: {
      faces: Array<{
        x: number
        y: number
        h: number
        w: number
      }>
    }
    orig: {
      faces: Array<{
        x: number
        y: number
        h: number
        w: number
      }>
    }
  }
  sizes: {
    large: {
      h: number
      w: number
      resize: string
    }
    medium: {
      h: number
      w: number
      resize: string
    }
    small: {
      h: number
      w: number
      resize: string
    }
    thumb: {
      h: number
      w: number
      resize: string
    }
  }
  original_info: {
    height: number
    width: number
    focus_rects: Array<{
      x: number
      y: number
      w: number
      h: number
    }>
  }
}

export interface SocialDataUserMention {
  id_str: string
  name: string
  screen_name: string
  indices: Array<number>
}

export interface SocialDataTweetEntities {
  media?: SocialDataMedia[]
  user_mentions: SocialDataUserMention[]
  urls: Array<any>
  hashtags: Array<any>
  symbols: Array<any>
}

export interface SocialDataUser {
  id: number
  id_str: string
  name: string
  screen_name: string
  location: string
  url: string | null
  description: string
  protected: boolean
  verified: boolean
  followers_count: number
  friends_count: number
  listed_count: number
  favourites_count: number
  statuses_count: number
  created_at: string
  profile_banner_url: string
  profile_image_url_https: string
  can_dm: boolean
}

export interface SocialDataSearchResponse {
  tweets: SocialDataTweet[]
  next_cursor?: string
}

export interface SocialDataUserTweetsMonitor {
  id: string
  created_at: string
  monitor_type: 'user_tweets'
  webhook_url: string | null
  parameters: {
    user_screen_name: string
    user_name: string
    user_id_str: string
  }
}

export interface SocialDataActiveMonitorsResponse {
  data: SocialDataUserTweetsMonitor[]
  meta: {
    page: number
    last_page: number
    items_count: number
  }
}

export type SocialDataUserTweetsMonitorResponse =
  | {
      status: 'success'
      data: SocialDataUserTweetsMonitor
    }
  | {
      status: 'error'
      message: string
    }

/**
 * Twitter search query operators
 */
export type TwitterSearchQuery = {
  // Basic text search
  text?: string

  // User filters
  from?: string | string[]
  to?: string | string[]
  mentions?: string | string[]
  list?: string
  blueVerified?: boolean

  // Tweet type filters
  includeRetweets?: boolean
  onlyRetweets?: boolean
  onlyReplies?: boolean
  selfThreads?: boolean
  conversationId?: string
  onlyQuotes?: boolean
  quotedTweetId?: string
  quotedUserId?: string

  // Date & Time filters
  since?: Date
  until?: Date
  sinceTime?: number
  untilTime?: number
  sinceId?: string
  maxId?: string
  withinTime?: string

  // Content filters
  url?: string
  language?: string

  // Geo filters
  near?: string
  within?: string
  geocode?: string
  place?: string

  // Engagement filters
  hasEngagement?: boolean
  minRetweets?: number
  maxRetweets?: number
  minLikes?: number
  maxLikes?: number
  minReplies?: number
  maxReplies?: number

  // Media filters
  media?: boolean
  images?: boolean
  videos?: boolean
  nativeVideo?: boolean
  links?: boolean
  spaces?: boolean
  news?: boolean
  safe?: boolean
  hashtags?: boolean
}
