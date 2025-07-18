import mongoose from 'mongoose'

import { getMongoUri } from '../env'
import { createDirIfNotExists } from './misc'

// Connection state tracking
let isConnected = false
let retryCount = 0
const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 1000
const DB_NAME = 'hono'
const USE_MEMORY_SERVER = process.env.USE_MEMORY_SERVER !== 'false'

// Memory server instance for development
let mongoMemoryServer: any = null

// Environment check
const isDevelopment = (useMemoryServer: boolean) =>
  useMemoryServer &&
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')

// Static port for MongoDB Memory Server
const MEMORY_SERVER_PORT = 27018 // Using 27018 to avoid conflicts with default MongoDB

export async function connectDb(useMemoryServer = Boolean(USE_MEMORY_SERVER)) {
  try {
    // If already connected, return
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('🔌 Using existing database connection')
      console.log(
        `📊 Connection State: ${mongoose.connection.readyState} (1=connected)`
      )
      console.log(
        `🔗 Connected to: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`
      )
      return mongoose.connection
    }

    let MONGO_URI: string

    if (isDevelopment(useMemoryServer)) {
      // First, try to connect to existing MongoDB instance on the port
      MONGO_URI = `mongodb://127.0.0.1:${MEMORY_SERVER_PORT}/${DB_NAME}`
      console.log(`🔍 Development mode - checking for MongoDB at: ${MONGO_URI}`)

      try {
        console.log('🔍 Attempting to connect to existing MongoDB instance...')

        // Try a quick connection test
        await mongoose.connect(MONGO_URI, {
          bufferCommands: false,
          connectTimeoutMS: 5000, // Quick timeout for testing
          serverSelectionTimeoutMS: 5000,
        })

        console.log('✅ Connected to existing MongoDB instance')
        console.log(`📊 Connection details:`)
        console.log(`   - URI: ${MONGO_URI}`)
        console.log(`   - Host: ${mongoose.connection.host}`)
        console.log(`   - Port: ${mongoose.connection.port}`)
        console.log(`   - Database: ${mongoose.connection.name}`)
        console.log(`   - State: ${mongoose.connection.readyState}`)
      } catch (connectionError) {
        console.log('⚡ No existing MongoDB found, starting Memory Server...')
        console.log(`   - Attempted URI: ${MONGO_URI}`)
        console.log(
          `   - Error: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`
        )

        // Close any failed connection attempt
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close()
        }

        // Only create a new Memory Server if connection failed
        const { MongoMemoryServer } = await import('mongodb-memory-server')

        if (!mongoMemoryServer) {
          try {
            const dbPath = createDirIfNotExists('.cache/db')
            console.log(
              `🚀 Creating MongoDB Memory Server on port ${MEMORY_SERVER_PORT}...`
            )
            mongoMemoryServer = await MongoMemoryServer.create({
              instance: {
                dbName: DB_NAME,
                port: MEMORY_SERVER_PORT,
                dbPath,
              },
            })

            MONGO_URI = mongoMemoryServer.getUri() + DB_NAME
            console.log('✅ MongoDB Memory Server started')
            console.log(`📊 Memory Server details:`)
            console.log(`   - URI: ${MONGO_URI}`)
            console.log(`   - Port: ${MEMORY_SERVER_PORT}`)
            console.log(`   - Database: ${DB_NAME}`)
          } catch (createError: any) {
            // If port is already in use, just use the existing connection
            if (createError.message?.includes('already in use')) {
              console.log(
                '📌 Port already in use, using existing MongoDB instance'
              )
              MONGO_URI = `mongodb://127.0.0.1:${MEMORY_SERVER_PORT}/${DB_NAME}`
              console.log(`   - Fallback URI: ${MONGO_URI}`)
            } else {
              throw createError
            }
          }
        }

        // Reconnect with full options
        console.log('🔄 Reconnecting with full options...')
        await mongoose.connect(MONGO_URI, {
          bufferCommands: false,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 60000,
          retryWrites: true,
          compressors: ['snappy', 'zlib'],
        })

        console.log('✅ Reconnection successful')
        console.log(`📊 Final connection details:`)
        console.log(`   - Host: ${mongoose.connection.host}`)
        console.log(`   - Port: ${mongoose.connection.port}`)
        console.log(`   - Database: ${mongoose.connection.name}`)
      }
    } else {
      // Use regular MongoDB URI for production
      const mongoUri = getMongoUri()

      // Check if URI exists - in development, we might not have it set
      if (!mongoUri && !isDevelopment) {
        throw new Error('MongoDB URI is not defined in environment variables')
      }

      // Fallback to default if no URI in development
      MONGO_URI = mongoUri!

      console.log('🔄 Connecting to MongoDB...')
      console.log(`📊 Production connection details:`)
      console.log(
        `   - URI: ${MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@')}`
      ) // Hide credentials

      // Connect with options
      await mongoose.connect(MONGO_URI, {
        bufferCommands: false,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 60000,
        retryWrites: true,
        // Disable zstd compression to avoid native module issues
        compressors: ['snappy', 'zlib'],
      })

      console.log('✅ Connected to production MongoDB')
      console.log(`   - Host: ${mongoose.connection.host}`)
      console.log(`   - Port: ${mongoose.connection.port}`)
      console.log(`   - Database: ${mongoose.connection.name}`)
    }

    // Set up mongoose connection options
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established')
      console.log(`   - Ready State: ${mongoose.connection.readyState}`)
      isConnected = true
      retryCount = 0
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected')
      isConnected = false

      // Attempt to reconnect with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount)
        retryCount++

        console.log(
          `🔄 Attempting reconnection in ${backoffTime}ms (attempt ${retryCount}/${MAX_RETRIES})`
        )
        setTimeout(async () => {
          try {
            await connectDb()
          } catch (err) {
            console.error('❌ Reconnection attempt failed', err)
          }
        }, backoffTime)
      } else {
        console.error('❌ Maximum reconnection attempts reached')
      }
    })

    // Set up GridFS bucket if not already set
    if (!mongoose.connection.bucket && mongoose.connection.db) {
      mongoose.connection.bucket = new mongoose.mongo.GridFSBucket(
        mongoose.connection.db,
        {
          bucketName: 'images',
        }
      )
    }

    isConnected = true
  } catch (error: unknown) {
    console.error(
      '❌ Connection to database failed',
      error instanceof Error ? error.message : error
    )

    isConnected = false

    // More specific error logging for better debugging
    if (
      error instanceof Error &&
      error.name === 'MongooseServerSelectionError'
    ) {
      console.error(
        '🔍 Server selection error - check network connectivity and IP allowlist in MongoDB Atlas'
      )
      console.error(
        '🔒 Verify that your Docker container IP is allowed in MongoDB Atlas network access settings'
      )
    }

    // Trigger reconnection if initial connection fails
    if (retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount)
      retryCount++

      console.log(
        `🔄 Attempting reconnection in ${backoffTime}ms (attempt ${retryCount}/${MAX_RETRIES})`
      )
      setTimeout(() => connectDb(), backoffTime)
    } else {
      console.error('❌ Maximum reconnection attempts reached')
    }
  }

  return mongoose.connection
}

// Shutdown function to close connection gracefully
export async function closeDbConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
    console.log('✅ Database connection closed gracefully')
    isConnected = false
  }

  // Stop memory server if it's running
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop()
    mongoMemoryServer = null
    console.log('✅ MongoDB Memory Server stopped')
  }
}
