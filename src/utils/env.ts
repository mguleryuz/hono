// Social Data / API Keys
export const getSocialDataToolsApiKey = (): string =>
  getEnvValue(
    'SOCIALDATA_TOOLS_API_KEY',
    'SOCIALDATA_TOOLS_API_KEY',
    'Social Data Tools API Key not found',
    ''
  )

export const getOpenAiApiKey = (): string =>
  getEnvValue(
    'OPENAI_API_KEY',
    'OPENAI_API_KEY',
    'OpenAI API Key not found',
    ''
  )

// Twitter/X Related
export const getXClientId = (): string =>
  getEnvValue('X_CLIENT_ID', 'X_CLIENT_ID', 'X Client ID not found', '')

export const getXClientSecret = (): string =>
  getEnvValue(
    'X_CLIENT_SECRET',
    'X_CLIENT_SECRET',
    'X Client Secret not found',
    ''
  )

export const getTwitterUsersToMonitor = (): string[] =>
  getEnvValue(
    'TWITTER_USERS_TO_MONITOR',
    'TWITTER_USERS_TO_MONITOR',
    'Twitter users to monitor not found',
    [],
    (value) => value.split(',')
  )

export const getMainAccountTwitterDisplayName = (): string =>
  getEnvValue(
    'MAIN_ACCOUNT_TWITTER_DISPLAY_NAME',
    'MAIN_ACCOUNT_TWITTER_DISPLAY_NAME',
    'Main account Twitter display name not found',
    'elonmusk'
  )

export const getTwitterAccessToken = (): string =>
  getEnvValue(
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_TOKEN',
    'Twitter Access Token not found',
    ''
  )

export const getTwitterAccessSecret = (): string =>
  getEnvValue(
    'TWITTER_ACCESS_SECRET',
    'TWITTER_ACCESS_SECRET',
    'Twitter Access Secret not found',
    ''
  )

export const getTwitterApiKey = (): string =>
  getEnvValue(
    'TWITTER_API_KEY',
    'TWITTER_API_KEY',
    'Twitter API Key not found',
    ''
  )

export const getTwitterApiSecret = (): string =>
  getEnvValue(
    'TWITTER_API_SECRET',
    'TWITTER_API_SECRET',
    'Twitter API Secret not found',
    ''
  )

// Infrastructure
export const getOrigin = (): string =>
  getEnvValue('ORIGIN', 'ORIGIN', 'Origin not found', '')

export const getMongoUri = (): string =>
  getEnvValue('MONGO_URI', 'MONGO_URI', 'MongoDB URI not found', '')

// Security
export const getSessionSecret = (): string =>
  getEnvValue(
    'SESSION_SECRET',
    'SESSION_SECRET',
    'Session secret not found',
    ''
  )

// -----------------------------------------------------------------------------
// HELPER

const getEnvValue = <T>(
  envKey: string,
  awsSecretKey: string,
  errorMessage: string,
  fallback?: T,
  parser: (value: string) => T = (value) => value as T
): T => {
  // Set value to undefined
  let value: T | undefined
  // Check if the value is set in the environment variables
  if (process.env[envKey]) {
    value = parser(process.env[envKey] as string)
  }
  // Check if the value is set in the AWS_SECRET environment variable
  if (process.env.AWS_SECRET) {
    const awsSecret = JSON.parse(process.env.AWS_SECRET)
    value = parser(awsSecret[awsSecretKey])
  }
  // If the value is not set, use fallback or throw error
  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error(errorMessage)
  }
  // Return the value
  return value
}
