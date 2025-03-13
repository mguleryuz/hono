const getEnvValue = <T>(
  envKey: string,
  awsSecretKey: string,
  errorMessage: string,
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
  // If the value is not set, throw an error
  if (value === undefined) throw new Error(errorMessage)
  // Return the value
  return value
}

export const getMongoUri = (): string =>
  getEnvValue('MONGO_URI', 'MONGO_URI', 'Mongo URI not found')

export const getDynamicId = (): string =>
  getEnvValue('VITE_DYNAMIC_ID', 'VITE_DYNAMIC_ID', 'Dynamic ID not found')
