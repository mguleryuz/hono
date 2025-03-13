import 'mongoose'

import { Connection as MongooseConnection } from 'mongoose'
import { GridFSBucket } from 'mongodb'

declare module 'mongoose' {
  interface Connection extends MongooseConnection {
    bucket: GridFSBucket
  }
}
