import mongoose from 'mongoose'
import { getMongoUri } from '../env'

// Connection state tracking
let isConnected = false
let retryCount = 0
const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 1000

export async function connectDb() {
  try {
    // If already connected, return
    if (isConnected) {
      console.log('🔌 Using existing database connection')
      return
    }

    const MONGO_URI = getMongoUri()

    // Check if URI exists
    if (!MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables')
    }

    console.log('🔄 Connecting to MongoDB...')

    // Set up mongoose connection options
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established')
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

    // Connect with options
    await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
      retryWrites: true,
    })

    mongoose.connection.bucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db!,
      {
        bucketName: 'images',
      }
    )

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
}
