import {
  getWhatsAppAccessToken,
  getWhatsAppBusinessAccountId,
  getWhatsAppPhoneNumberId,
  logger,
  normalizePhoneNumber,
} from '@/utils'
import debug from 'debug'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { WABAClient } from 'whatsapp-business'

import { UserModel } from './mongo'
import type {
  GetCleanSuccessType,
  GetRequestParams,
  InternalSession,
} from './types'

const d = debug('moai:auth-whatsapp')

type SendOtpPayloadType = GetRequestParams<'whatsappAuth', 'sendOtp'>['payload']
type SendOtpResponseType = GetCleanSuccessType<'whatsappAuth', 'sendOtp'>
type VerifyOtpPayloadType = GetRequestParams<
  'whatsappAuth',
  'verifyOtp'
>['payload']
type SessionType = GetCleanSuccessType<'whatsappAuth', 'session'>
type SignOutResponseType = GetCleanSuccessType<'whatsappAuth', 'signout'>

/**
 * @description WhatsApp authentication service that handles OTP-based authentication
 * Uses WhatsApp Business API SDK to send OTP codes via WhatsApp messages
 */
export class AuthWhatsAppService {
  readonly wabaClient: WABAClient | null = null

  constructor() {
    const accessToken = getWhatsAppAccessToken()
    const phoneNumberId = getWhatsAppPhoneNumberId()
    const accountId = getWhatsAppBusinessAccountId()

    if (!accessToken || !phoneNumberId || !accountId) {
      logger.warn(
        'WhatsApp credentials not configured properly. Required: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID'
      )
      return
    }

    this.wabaClient = new WABAClient({
      accountId,
      apiToken: accessToken,
      phoneId: phoneNumberId,
    })
  }

  /**
   * @description Sends an OTP code to the provided phone number via WhatsApp
   * @param {Context} c - Hono context object
   * @returns {Promise<SendOtpResponseType>} Success status and message
   * @example
   * // POST /api/auth/whatsapp/send-otp
   * // Body: { "phone_number": "+1234567890" }
   */
  async sendOtp(c: Context): Promise<SendOtpResponseType> {
    try {
      const { phone_number }: SendOtpPayloadType = await c.req.json()

      if (!phone_number) {
        throw new HTTPException(400, {
          message: 'Phone number is required',
        })
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+[1-9]\d{8,14}$/
      if (!phoneRegex.test(phone_number)) {
        d('Invalid phone number format', phone_number)
        throw new HTTPException(400, {
          message:
            'Invalid phone number format. Use international format with +',
        })
      }

      // Generate 6-digit OTP
      const otpCode = this.generateOtp()

      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Format phone number for WhatsApp (remove + prefix)
      const formattedPhoneNumber = phone_number.startsWith('+')
        ? phone_number.substring(1)
        : phone_number

      if (!this.wabaClient) {
        throw new Error('WhatsApp client not initialized')
      }

      // Send OTP via WhatsApp Business API SDK
      const wabaResponse = await this.wabaClient.sendMessage({
        to: formattedPhoneNumber,
        type: 'template',
        template: {
          name: 'otp_verification', // Your template name
          language: {
            code: 'en_US',
            policy: 'deterministic',
          },
          components: [
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: otpCode.toString(),
                },
              ],
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otpCode.toString(),
                },
              ],
            },
          ],
        },
      })

      logger.info('WhatsApp OTP sent successfully using SDK', wabaResponse)

      // Store OTP details and phone number in session temporarily
      c.req.session.whatsapp_otp = otpCode
      c.req.session.whatsapp_otp_expires_at = expiresAt.getTime()
      c.req.session.whatsapp_phone = normalizePhoneNumber(phone_number)

      logger.info('OTP sent successfully', {
        phone_number: this.maskPhoneNumber(phone_number),
        expires_at: expiresAt,
      })

      return {
        success: true,
        message: 'OTP sent successfully to your WhatsApp number',
      }
    } catch (error: any) {
      return this.handleError(error, 'Error sending OTP')
    }
  }

  /**
   * @description Verifies the OTP code provided by the user
   * @param {Context} c - Hono context object
   * @returns {Promise<WhatsAppAuthType>} Authentication state with user details
   * @example
   * // POST /api/auth/whatsapp/verify-otp
   * // Body: { "otp_code": "123456" }
   */
  async verifyOtp(c: Context): Promise<SessionType> {
    try {
      const { otp_code }: VerifyOtpPayloadType = await c.req.json()

      if (!otp_code) {
        d('OTP code is required', {
          otp_code,
        })
        throw new HTTPException(400, {
          message: 'OTP code is required',
        })
      }

      // Get OTP details from session
      const { whatsapp_otp, whatsapp_otp_expires_at, whatsapp_phone } =
        c.req.session || {}

      if (!whatsapp_otp || !whatsapp_otp_expires_at || !whatsapp_phone) {
        d('No OTP found in session', {
          whatsapp_otp,
          whatsapp_otp_expires_at,
          whatsapp_phone,
        })
        throw new HTTPException(400, {
          message: 'No OTP found. Please request a new OTP.',
        })
      }

      // Check if OTP has expired
      if (Date.now() > whatsapp_otp_expires_at) {
        d('OTP has expired', {
          whatsapp_otp_expires_at,
        })
        // Clear expired OTP from session
        this.clearOtpFromSession(c)
        throw new HTTPException(400, {
          message: 'OTP has expired. Please request a new one.',
        })
      }

      // Verify OTP code
      if (String(whatsapp_otp) !== String(otp_code)) {
        d('Invalid OTP code', {
          whatsapp_otp,
          otp_code,
        })
        throw new HTTPException(400, {
          message: 'Invalid OTP code. Please try again.',
        })
      }

      // Find existing user by phone number
      const existingUser = await UserModel.findOne({
        whatsapp_phone,
      }).lean()

      const state = {
        mongo_id: existingUser?._id.toString(),
        role: 'USER',
        whatsapp_phone,
        status: 'authenticated',
      } satisfies InternalSession

      // Update existing user or create new user
      if (existingUser) {
        state.role = existingUser.role
        Object.assign(c.req.session, state)
      } else {
        try {
          // Create new user
          const newUser = new UserModel({
            whatsapp_phone,
          })

          await newUser.save()
          state.mongo_id = newUser._id.toString()
          Object.assign(c.req.session, state)
        } catch (error: any) {
          logger.error('Error creating new user', {
            error: error.message,
            phone_number: this.maskPhoneNumber(whatsapp_phone),
          })
          throw new HTTPException(500, {
            message: 'Failed to create user account',
          })
        }
      }

      // Clear OTP from session after successful verification
      this.clearOtpFromSession(c)

      logger.info('OTP verification successful', {
        phone_number: this.maskPhoneNumber(whatsapp_phone),
        user_id: state.mongo_id,
      })

      const response: SessionType = {
        mongo_id: state.mongo_id!,
        role: state.role,
        whatsapp_phone: state.whatsapp_phone,
        status: 'authenticated',
      }
      return response
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error
      }

      logger.error('Error verifying OTP', {
        error: error.message,
        stack: error.stack,
      })

      throw new HTTPException(500, {
        message: 'Failed to verify OTP. Please try again.',
      })
    }
  }

  /**
   * @description Gets the current session data for WhatsApp authenticated users
   * @param {Context} c - Hono context object
   * @returns {Promise<WhatsAppSessionType>} Current session data
   */
  async session(c: Context): Promise<SessionType> {
    const sessionData = c.req.session

    if (!sessionData?.id || !sessionData?.role) {
      throw new HTTPException(401, {
        message: 'Unauthorized',
      })
    }

    return {
      mongo_id: sessionData.mongo_id!,
      role: sessionData.role,
      whatsapp_phone: sessionData.whatsapp_phone!,
      status: 'authenticated',
    }
  }

  /**
   * @description Signs out the user by destroying the session
   * @param {Context} c - Hono context object
   * @returns {Promise<SignOutResponseType>} Success status
   */
  async signout(c: Context): Promise<SignOutResponseType> {
    c.req.session.destroy()

    return { success: true }
  }

  /**
   * @description Clears OTP-related data from session
   * @param {Context} c - Hono context object
   * @private
   */
  private clearOtpFromSession(c: Context): void {
    delete c.req.session.whatsapp_otp
    delete c.req.session.whatsapp_otp_expires_at
    delete c.req.session.whatsapp_phone
  }

  /**
   * @description Handles errors with consistent logging and HTTP responses
   * @param {any} error - The error to handle
   * @param {string} context - Context description for logging
   * @returns Never - always throws HTTPException
   * @private
   */
  private handleError(error: any, context: string): never {
    logger.error(context, {
      error: error.message,
      stack: error.stack,
    })

    if (error instanceof HTTPException) {
      throw error
    }

    // Handle WhatsApp Business API errors
    if (error?.code && error?.message) {
      logger.error('WhatsApp Business API error', {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      throw new HTTPException(400, {
        message: `WhatsApp API error: ${error.message}`,
      })
    }

    throw new HTTPException(500, {
      message: 'Failed to process request. Please try again.',
    })
  }

  /**
   * @description Generates a 6-digit OTP code
   * @returns {number} Generated OTP code
   * @private
   */
  private generateOtp(): number {
    return Math.floor(100000 + Math.random() * 900000)
  }

  /**
   * @description Masks phone number for logging (security)
   * @param {string} phoneNumber - Phone number to mask
   * @returns {string} Masked phone number
   * @private
   * @example
   * maskPhoneNumber("+1234567890") // returns "+123****890"
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 6) return phoneNumber
    const start = phoneNumber.slice(0, 4)
    const end = phoneNumber.slice(-3)
    const middle = '*'.repeat(phoneNumber.length - 7)
    return `${start}${middle}${end}`
  }
}
