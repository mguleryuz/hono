import { logger } from './logger'

// Social Data / API Keys
export const getSocialDataToolsApiKey = () =>
  getEnvValue<string>('SOCIALDATA_TOOLS_API_KEY', 'SOCIALDATA_TOOLS_API_KEY')

export const getOpenAiApiKey = () =>
  getEnvValue<string>('OPENAI_API_KEY', 'OPENAI_API_KEY')

export const getDrpcApiKey = () =>
  getEnvValue<string>('DRPC_API_KEY', 'DRPC_API_KEY')

// Twitter/X Related
export const getXClientId = () =>
  getEnvValue<string>('X_CLIENT_ID', 'X_CLIENT_ID')

export const getXClientSecret = () =>
  getEnvValue<string>('X_CLIENT_SECRET', 'X_CLIENT_SECRET')

export const getTwitterUsersToMonitor = () =>
  getEnvValue<string[]>(
    'TWITTER_USERS_TO_MONITOR',
    'TWITTER_USERS_TO_MONITOR',
    [],
    (value) => value.split(',')
  )

export const getMainAccountTwitterDisplayName = () =>
  getEnvValue<string>(
    'MAIN_ACCOUNT_TWITTER_DISPLAY_NAME',
    'MAIN_ACCOUNT_TWITTER_DISPLAY_NAME',
    'elonmusk'
  )

export const getTwitterAccessToken = () =>
  getEnvValue<string>('TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN')

export const getTwitterAccessSecret = () =>
  getEnvValue<string>('TWITTER_ACCESS_SECRET', 'TWITTER_ACCESS_SECRET')

export const getTwitterApiKey = () =>
  getEnvValue<string>('TWITTER_API_KEY', 'TWITTER_API_KEY')

export const getTwitterApiSecret = () =>
  getEnvValue<string>('TWITTER_API_SECRET', 'TWITTER_API_SECRET')

// Infrastructure
export const getOrigin = () => getEnvValue<string>('ORIGIN', 'ORIGIN')

export const getMongoUri = () => getEnvValue<string>('MONGO_URI', 'MONGO_URI')

// Security
export const getSessionSecret = () =>
  getEnvValue('SESSION_SECRET', 'SESSION_SECRET', 'SESSION_SECRET')

export const getAuthMethod = () =>
  getEnvValue<'evm' | 'twitter' | 'none'>('AUTH_METHOD', 'AUTH_METHOD', 'none')

// -----------------------------------------------------------------------------
// HELPER

// Function overloads to properly handle the return type
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
    logger.warn(`No environment variable found for ${envKey} ⚠️, skipping...`)
    return undefined
  }
  // Return the value
  return value
}
