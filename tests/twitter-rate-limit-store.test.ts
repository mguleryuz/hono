import { TwitterRateLimitMongoStore } from '@/mongo/helpers/twitter.rate-limit-store'
import { closeDbConnection, connectDb } from '@/utils/server/connect-db'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import mongoose from 'mongoose'

describe('TwitterRateLimitMongoStore', () => {
  let store: TwitterRateLimitMongoStore
  const testUserId = 'test-user-123'
  const mockPlugin = {} as any // Mock plugin for testing

  beforeAll(async () => {
    // Use the existing connectDb utility which handles memory server
    await connectDb()
  })

  afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState !== 0) {
      const TwitterRateLimitModel = mongoose.model('twitter_rate_limits')
      await TwitterRateLimitModel.deleteMany({ user_id: testUserId })
    }

    // Use the existing closeDbConnection utility
    await closeDbConnection()
  })

  it('should initialize store with user ID', () => {
    store = new TwitterRateLimitMongoStore(testUserId)
    expect(store).toBeDefined()
  })

  it('should store and retrieve rate limits', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set a rate limit
    await store.set({
      endpoint: 'https://api.twitter.com/2/tweets',
      method: 'GET',
      rateLimit: {
        limit: 15,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
      },
      plugin: mockPlugin,
    })

    // Retrieve the rate limit
    const result = await store.get({
      endpoint: 'https://api.twitter.com/2/tweets',
      method: 'GET',
      plugin: mockPlugin,
    })

    expect(result).toBeDefined()
    expect(result?.limit).toBe(15)
    expect(result?.remaining).toBe(0)
    expect(result?.reset).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('should handle rate limits with day limits', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set a rate limit with day limit
    await store.set({
      endpoint: 'https://api.twitter.com/2/tweets/search/recent',
      method: 'GET',
      rateLimit: {
        limit: 180,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900,
        day: {
          limit: 1000,
          remaining: 950,
          reset: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        },
      },
      plugin: mockPlugin,
    })

    // Retrieve the rate limit
    const result = await store.get({
      endpoint: 'https://api.twitter.com/2/tweets/search/recent',
      method: 'GET',
      plugin: mockPlugin,
    })

    expect(result).toBeDefined()
    expect(result?.limit).toBe(180)
    expect(result?.remaining).toBe(0)
    expect(result?.day).toBeDefined()
    expect(result?.day?.limit).toBe(1000)
    expect(result?.day?.remaining).toBe(950)
  })

  it('should normalize endpoints correctly', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set rate limit with twitter.com domain
    await store.set({
      endpoint: 'https://api.twitter.com/2/users/me',
      method: 'GET',
      rateLimit: {
        limit: 75,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900,
      },
      plugin: mockPlugin,
    })

    // Should find it with x.com domain (normalized)
    const result = await store.get({
      endpoint: 'https://api.x.com/2/users/me',
      method: 'GET',
      plugin: mockPlugin,
    })

    expect(result).toBeDefined()
    expect(result?.limit).toBe(75)
    expect(result?.remaining).toBe(0)
  })

  it('should update existing rate limits', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set initial rate limit
    await store.set({
      endpoint: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      rateLimit: {
        limit: 300,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900,
      },
      plugin: mockPlugin,
    })

    // Update the same endpoint
    await store.set({
      endpoint: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      rateLimit: {
        limit: 300,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900,
      },
      plugin: mockPlugin,
    })

    // Retrieve and verify update
    const result = await store.get({
      endpoint: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      plugin: mockPlugin,
    })

    expect(result).toBeDefined()
    expect(result?.remaining).toBe(0)
  })

  it('should not return expired rate limits', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set an expired rate limit
    await store.set({
      endpoint: 'https://api.twitter.com/2/expired',
      method: 'GET',
      rateLimit: {
        limit: 15,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
      },
      plugin: mockPlugin,
    })

    // Should not retrieve expired rate limit
    const result = await store.get({
      endpoint: 'https://api.twitter.com/2/expired',
      method: 'GET',
      plugin: mockPlugin,
    })

    expect(result).toBeUndefined()
  })

  it('should handle cleanup of expired rate limits', async () => {
    store = new TwitterRateLimitMongoStore(testUserId)

    // Set expired and non-expired rate limits
    await store.set({
      endpoint: 'https://api.twitter.com/2/old',
      method: 'GET',
      rateLimit: {
        limit: 15,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      },
      plugin: mockPlugin,
    })

    await store.set({
      endpoint: 'https://api.twitter.com/2/current',
      method: 'GET',
      rateLimit: {
        limit: 15,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
      },
      plugin: mockPlugin,
    })

    // Clean up expired
    await store.cleanupExpired()

    // Verify old is gone
    const oldResult = await store.get({
      endpoint: 'https://api.twitter.com/2/old',
      method: 'GET',
      plugin: mockPlugin,
    })
    expect(oldResult).toBeUndefined()

    // Verify current still exists
    const currentResult = await store.get({
      endpoint: 'https://api.twitter.com/2/current',
      method: 'GET',
      plugin: mockPlugin,
    })
    expect(currentResult).toBeDefined()
    expect(currentResult?.remaining).toBe(0)
  })
})
