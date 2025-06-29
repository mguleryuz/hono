export * from './chain'
export * from './env'
export * from './logger'

/**
 * @description Normalizes a phone number by removing the leading "+" if present
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} The normalized phone number without "+"
 * @example
 * const phone = '+1234567890'
 * const normalized = normalizePhoneNumber(phone)
 * console.log(normalized) // '1234567890'
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber
}
