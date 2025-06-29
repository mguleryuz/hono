import { describe, expect, it } from 'bun:test'
import { JSONSchema, Schema } from 'effect'

import {
  ApiSecretSchema,
  UserRoleSchema,
  UserSchema,
  XRateLimitSchema,
  XRateLimitWithContextSchema,
} from '../src/schemas/user.schema'

describe('User Schemas', () => {
  describe('UserRoleSchema', () => {
    it('should accept valid user roles', () => {
      expect(Schema.decodeUnknownSync(UserRoleSchema)('USER')).toBe('USER')
      expect(Schema.decodeUnknownSync(UserRoleSchema)('ADMIN')).toBe('ADMIN')
      expect(Schema.decodeUnknownSync(UserRoleSchema)('SUPER')).toBe('SUPER')
    })

    it('should reject invalid user roles', () => {
      expect(() =>
        Schema.decodeUnknownSync(UserRoleSchema)('INVALID')
      ).toThrow()
    })
  })

  describe('ApiSecretSchema', () => {
    it('should accept valid api secret', () => {
      const validSecret = {
        title: 'Test Secret',
        secret: 'secret-key-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const decoded = Schema.decodeUnknownSync(ApiSecretSchema)(validSecret)
      expect(decoded.title).toBe('Test Secret')
      expect(decoded.secret).toBe('secret-key-123')
    })

    it('should reject invalid api secret', () => {
      const invalidSecret = {
        title: 'Test Secret',
        // missing secret field
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(() =>
        Schema.decodeUnknownSync(ApiSecretSchema)(invalidSecret)
      ).toThrow()
    })
  })

  describe('XRateLimitWithContextSchema', () => {
    it('should accept valid rate limit with context', () => {
      const validRateLimit = {
        limit: 15,
        remaining: 14,
        reset: 1234567890,
        endpoint: 'tweets/search/recent',
        method: 'GET',
        last_updated: new Date(),
      }
      const decoded = Schema.decodeUnknownSync(XRateLimitWithContextSchema)(
        validRateLimit
      )
      expect(decoded.limit).toBe(15)
      expect(decoded.endpoint).toBe('tweets/search/recent')
    })

    it('should accept rate limit with day limits', () => {
      const validRateLimit = {
        limit: 15,
        remaining: 14,
        reset: 1234567890,
        day: {
          limit: 100,
          remaining: 99,
          reset: 1234567890,
        },
        endpoint: 'tweets/search/recent',
        method: 'GET',
        last_updated: new Date(),
      }
      const decoded = Schema.decodeUnknownSync(XRateLimitWithContextSchema)(
        validRateLimit
      )
      expect(decoded.day?.limit).toBe(100)
    })
  })

  describe('UserSchema', () => {
    it('should accept valid user with minimal fields', () => {
      const validUser = {
        role: 'USER',
        api_secrets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const decoded = Schema.decodeUnknownSync(UserSchema)(validUser)
      expect(decoded.role).toBe('USER')
      expect(decoded.api_secrets).toEqual([])
    })

    it('should accept valid user with all fields', () => {
      const validUser = {
        role: 'ADMIN',
        address: '0x1234567890abcdef',
        twitter_access_token: 'access-token',
        twitter_refresh_token: 'refresh-token',
        twitter_access_token_expires_at: new Date(),
        twitter_user_id: '123456789',
        twitter_username: 'testuser',
        twitter_display_name: 'Test User',
        twitter_profile_image_url: 'https://example.com/image.jpg',
        twitter_rate_limits: [
          {
            limit: 15,
            remaining: 14,
            reset: 1234567890,
            endpoint: 'tweets/search/recent',
            method: 'GET',
            last_updated: new Date(),
          },
        ],
        whatsapp_phone: '+1234567890',
        api_secrets: [
          {
            title: 'API Key',
            secret: 'secret-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        web_hook_url: 'https://example.com/webhook',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const decoded = Schema.decodeUnknownSync(UserSchema)(validUser)
      expect(decoded.role).toBe('ADMIN')
      expect(decoded.address).toBe('0x1234567890abcdef')
      expect(decoded.twitter_username).toBe('testuser')
      expect(decoded.api_secrets).toHaveLength(1)
    })

    it('should reject invalid user', () => {
      const invalidUser = {
        // missing required role field
        api_secrets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(() => Schema.decodeUnknownSync(UserSchema)(invalidUser)).toThrow()
    })
  })
})

describe('User Schema JSON Schema Generation', () => {
  it('should generate JSON Schema without errors', () => {
    // This test verifies that all DateFromSelf fields have proper annotations
    // If this throws, it means our date fields are missing JSON Schema annotations
    expect(() => JSONSchema.make(UserSchema)).not.toThrow()
  })

  it('should generate JSON Schema for ApiSecretSchema', () => {
    expect(() => JSONSchema.make(ApiSecretSchema)).not.toThrow()
  })

  it('should generate JSON Schema for XRateLimitSchema', () => {
    expect(() => JSONSchema.make(XRateLimitSchema)).not.toThrow()
  })
})
