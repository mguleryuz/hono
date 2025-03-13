import mongoose from 'mongoose'
import { getMongoUri } from './env'

const MONGO_URI = getMongoUri()

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI!, {
      bufferCommands: false,
    })
    mongoose.connection.bucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db!,
      {
        bucketName: 'images',
      }
    )
    console.log('✅ New connection established')
  } catch (error) {
    console.error('❌ Connection to database failed')
    throw error
  }

  return
}
