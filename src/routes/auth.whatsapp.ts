import { Hono } from 'hono'
import type { HTTPException } from 'hono/http-exception'

import { authWhatsAppService } from '..'

/**
 * @description WhatsApp authentication routes
 * Handles OTP-based authentication flow via WhatsApp Business API
 */
export const authWhatsApp = new Hono()

/**
 * @description Send OTP to WhatsApp number
 * @route POST /api/auth/whatsapp/send-otp
 * @body { phone_number: string } - Phone number in international format (+1234567890)
 * @returns { success: boolean, message: string }
 * @example
 * curl -X POST http://localhost:8080/api/auth/whatsapp/send-otp \
 *   -H "Content-Type: application/json" \
 *   -d '{"phone_number": "+1234567890"}'
 */
authWhatsApp.post('/send-otp', async (c) => {
  try {
    const result = await authWhatsAppService.sendOtp(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})

/**
 * @description Verify OTP code received via WhatsApp
 * @route POST /api/auth/whatsapp/verify-otp
 * @body { otp_code: string } - 6-digit OTP code received via WhatsApp
 * @returns { id: string, role: string, chains: Array, status: string }
 * @example
 * curl -X POST http://localhost:8080/api/auth/whatsapp/verify-otp \
 *   -H "Content-Type: application/json" \
 *   -d '{"otp_code": "123456"}' \
 *   --cookie-jar cookies.txt
 */
authWhatsApp.post('/verify-otp', async (c) => {
  try {
    const result = await authWhatsAppService.verifyOtp(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})

/**
 * @description Get current WhatsApp authentication session
 * @route GET /api/auth/whatsapp/session
 * @returns { chains: Array, role: string, status: string }
 * @example
 * curl -X GET http://localhost:8080/api/auth/whatsapp/session \
 *   -H "Content-Type: application/json" \
 *   --cookie cookies.txt
 */
authWhatsApp.get('/session', async (c) => {
  try {
    const result = await authWhatsAppService.session(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})

/**
 * @description Sign out and destroy WhatsApp authentication session
 * @route GET /api/auth/whatsapp/signout
 * @returns { success: boolean }
 * @example
 * curl -X GET http://localhost:8080/api/auth/whatsapp/signout \
 *   --cookie cookies.txt
 */
authWhatsApp.get('/signout', async (c) => {
  try {
    const result = await authWhatsAppService.signout(c)
    return c.json(result)
  } catch (error: unknown) {
    const e = error as HTTPException
    return c.json({ message: e.message }, e.status)
  }
})
