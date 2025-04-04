import mongoose from 'mongoose'
import { getMongoUri } from '../env'

const MONGO_URI = getMongoUri()

export async function connectDB() {
  try {
    // Check if URI exists
    if (!MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables')
    }

    console.log('🔄 Connecting to MongoDB...')

    await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      // Add these options to handle Atlas connections better, especially in Docker
      connectTimeoutMS: 30000, // Increase connection timeout
      socketTimeoutMS: 45000, // Increase socket timeout
      serverSelectionTimeoutMS: 60000, // Longer server selection timeout for container environments
      retryWrites: true,
    })

    mongoose.connection.bucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db!,
      {
        bucketName: 'images',
      }
    )
    console.log('✅ New connection established')
  } catch (error: unknown) {
    console.error(
      '❌ Connection to database failed',
      error instanceof Error ? error.message : error
    )

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

    throw error
  }

  return
}
