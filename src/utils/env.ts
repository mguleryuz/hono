import chalk from 'chalk'

import { logger } from './logger'

// =============================================================================
// TYPES
// =============================================================================

/**
 * @description Supported authentication methods
 */
export type AuthMethod = 'evm' | 'whatsapp' | 'x' | 'none'

// =============================================================================
// AUTHENTICATION & SECURITY
// =============================================================================

/**
 * @description Get the authentication method for the application
 * @returns {AuthMethod} The authentication method (evm, whatsapp, or none)
 */
export const getAuthMethod = () =>
  getEnvValue<AuthMethod>('VITE_AUTH_METHOD', 'VITE_AUTH_METHOD', 'none')

/**
 * @description Get the session secret for secure session management
 * @returns {string} The session secret key
 */
export const getSessionSecret = () =>
  getEnvValue('SESSION_SECRET', 'SESSION_SECRET', 'SESSION_SECRET')

// =============================================================================
// EXTERNAL API KEYS
// =============================================================================

/**
 * @description Get the OpenAI API key for AI/ML operations
 * @returns {string | undefined} The OpenAI API key
 */
export const getOpenAiApiKey = () =>
  getEnvValue<string>('OPENAI_API_KEY', 'OPENAI_API_KEY')

/**
 * @description Get the Google Generative AI API key for AI/ML operations
 * @returns {string | undefined} The Google Generative AI API key
 */
export const getGoogleGenerativeAiApiKey = () =>
  getEnvValue<string>(
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    undefined,
    (value) => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = value
      return value
    }
  )

/**
 * @description Get the Social Data Tools API key
 * @returns {string | undefined} The Social Data Tools API key
 */
export const getSocialDataToolsApiKey = () =>
  getEnvValue<string>('SOCIALDATA_TOOLS_API_KEY', 'SOCIALDATA_TOOLS_API_KEY')

/**
 * @description Get the DRPC API key for blockchain RPC access
 * @returns {string | undefined} The DRPC API key
 */
export const getDrpcApiKey = () =>
  getEnvValue<string>('VITE_DRPC_API_KEY', 'VITE_DRPC_API_KEY')

// =============================================================================
// INFRASTRUCTURE & DATABASE
// =============================================================================

/**
 * @description Get the application origin URL
 * @returns {string | undefined} The origin URL (e.g., https://example.com)
 */
export const getOrigin = () => getEnvValue<string>('ORIGIN', 'ORIGIN')

/**
 * @description Get the MongoDB connection URI
 * @returns {string | undefined} The MongoDB connection string
 */
export const getMongoUri = () => getEnvValue<string>('MONGO_URI', 'MONGO_URI')

// =============================================================================
// SENDPULSE CONFIGURATION
// =============================================================================

/**
 * @description Get the SendPulse webhook token for webhook authentication
 * @returns {string | undefined} The webhook token with "Bearer " prefix
 */
export const getSendPulseWebhookToken = () =>
  getEnvValue<string>(
    'SENDPULSE_WEBHOOK_TOKEN',
    'SENDPULSE_WEBHOOK_TOKEN',
    'Bearer ',
    (value) => (value.startsWith('Bearer ') ? value : `Bearer ${value}`)
  )

/**
 * @description Get the SendPulse OAuth client ID
 * @returns {string | undefined} The SendPulse client ID
 */
export const getSendPulseClientId = () =>
  getEnvValue<string>('SENDPULSE_CLIENT_ID', 'SENDPULSE_CLIENT_ID')

/**
 * @description Get the SendPulse OAuth client secret
 * @returns {string | undefined} The SendPulse client secret
 */
export const getSendPulseClientSecret = () =>
  getEnvValue<string>('SENDPULSE_CLIENT_SECRET', 'SENDPULSE_CLIENT_SECRET')

// =============================================================================
// WHATSAPP BUSINESS API
// =============================================================================

/**
 * @description Get the WhatsApp Business API access token
 * @returns {string | undefined} The WhatsApp access token
 */
export const getWhatsAppAccessToken = () =>
  getEnvValue<string>('WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_ACCESS_TOKEN')

/**
 * @description Get the WhatsApp phone number ID for sending messages
 * @returns {string | undefined} The WhatsApp phone number ID
 */
export const getWhatsAppPhoneNumberId = () =>
  getEnvValue<string>('WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_PHONE_NUMBER_ID')

/**
 * @description Get the WhatsApp Business Account ID
 * @returns {string | undefined} The WhatsApp Business Account ID
 */
export const getWhatsAppBusinessAccountId = () =>
  getEnvValue<string>(
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID'
  )

/**
 * @description Get the WhatsApp App ID for OAuth
 * @returns {string | undefined} The WhatsApp App ID
 */
export const getWhatsAppAppId = () =>
  getEnvValue<string>('WHATSAPP_APP_ID', 'WHATSAPP_APP_ID')

/**
 * @description Get the WhatsApp App Secret for OAuth
 * @returns {string | undefined} The WhatsApp App Secret
 */
export const getWhatsAppAppSecret = () =>
  getEnvValue<string>('WHATSAPP_APP_SECRET', 'WHATSAPP_APP_SECRET')

// =============================================================================
// TWITTER CONFIGURATION
// =============================================================================

/**
 * @description Get the Twitter API key
 * @returns {string | undefined} The Twitter API key
 */
export const getXClientId = () =>
  getEnvValue<string>('X_CLIENT_ID', 'X_CLIENT_ID')

/**
 * @description Get the Twitter API key
 * @returns {string | undefined} The Twitter API key
 */
export const getXClientSecret = () =>
  getEnvValue<string>('X_CLIENT_SECRET', 'X_CLIENT_SECRET')

/**
 * @description Get the Twitter API key
 * @returns {string | undefined} The Twitter API key
 */
export const getXAccessToken = () =>
  getEnvValue<string>('X_ACCESS_TOKEN', 'X_ACCESS_TOKEN')

/**
 * @description Get the Twitter API key
 * @returns {string | undefined} The Twitter API key
 */
export const getXAccessTokenSecret = () =>
  getEnvValue<string>('X_ACCESS_TOKEN_SECRET', 'X_ACCESS_TOKEN_SECRET')

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @description Get environment variable value with fallback and AWS Secrets support
 * @param {string} envKey - The environment variable key
 * @param {string} awsSecretKey - The AWS Secret key
 * @param {T} fallback - Optional fallback value
 * @param {Function} parser - Optional parser function to transform the value
 * @returns {T | undefined} The parsed environment value or fallback
 */
function getEnvValue<T>(
  envKey: string,
  awsSecretKey: string,
  fallback: T,
  parser?: (value: string) => T
): T

function getEnvValue<T>(
  envKey: string,
  awsSecretKey: string,
  fallback?: undefined,
  parser?: (value: string) => T
): T | undefined

function getEnvValue<T>(
  envKey: string,
  awsSecretKey: string,
  fallback?: T,
  parser: (value: string) => T = (value) => value as T
): T | undefined {
  // Set value to undefined
  let value: T | undefined = undefined

  // Check if the value is set in the environment variables
  if (process.env[envKey]) {
    value = parser(process.env[envKey] as string)
  }

  // Check if the value is set in the AWS_SECRET environment variable
  if (value === undefined && process.env.AWS_SECRET) {
    try {
      const awsSecret = JSON.parse(process.env.AWS_SECRET)
      if (awsSecret[awsSecretKey]) {
        value = parser(awsSecret[awsSecretKey])
      }
    } catch (e) {
      logger.warn(`Error parsing AWS_SECRET: ${e}`)
    }
  }

  // If the value is not set, use fallback or log warning
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback
    }
    logger.warn(
      `No environment variable found for ${chalk.bold(envKey)}, skipping...`
    )
    return undefined
  }

  // Return the value
  return value
}
