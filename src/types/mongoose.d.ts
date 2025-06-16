import 'mongoose'

import { GridFSBucket } from 'mongodb'
import { Connection as MongooseConnection } from 'mongoose'

declare module 'mongoose' {
  interface Connection extends MongooseConnection {
    bucket: GridFSBucket
  }
}
