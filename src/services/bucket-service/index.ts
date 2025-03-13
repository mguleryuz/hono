import { Readable } from 'stream'
import mongoose from 'mongoose'
import type { PrunedFile } from '@inverter-network/sdk'

import type {
  BucketExistsParams,
  BucketExistsReturnType,
  GetBucketParams,
  GetBucketReturnType,
  UploadBucketParams,
  UploadBucketReturnType,
} from '@/types'

export class BucketService {
  private readonly bucket = mongoose.connection.bucket

  // UPLOAD
  // ----------------------------------------------------------------------------
  async upload({
    prunedFile,
  }: UploadBucketParams): Promise<UploadBucketReturnType> {
    // Step 1. Check if bucket exists
    if (!this.bucket) throw new Error('Database not connected')
    // Step 2. Get blob data without name
    const { name, ...rest } = prunedFile
    // Step 3. Generate new name
    const newName = crypto.randomUUID()
    // Step 4. Parse blob
    const blob = this.parseFile({ ...rest, name: newName })
    // Step 5. Convert the blob to buffer
    let buffer = Buffer.from(await blob.arrayBuffer())
    // Step 6. Convert buffer to stream
    const stream = Readable.from(buffer)
    // Step 7. Open upload stream
    const uploadStream = this.bucket.openUploadStream(blob.name, {
      contentType: blob.type,
      metadata: {}, // Add your metadata here if any
    })
    // Step 8. Pipe the readable stream to a writable stream to save it to the database
    stream.pipe(uploadStream)
    // Step 9. Return new name
    return newName
  }

  // EXISTS
  // ----------------------------------------------------------------------------
  async exists({
    filename,
  }: BucketExistsParams): Promise<BucketExistsReturnType> {
    // Step 1. Count documents with the given filename
    const count = await mongoose.connection
      .db!.collection('images.files')
      .countDocuments({ filename })
    // Step 2. Return true if count is greater than 0, otherwise false
    return !!count
  }

  // GET
  // ----------------------------------------------------------------------------
  async get({ filename }: GetBucketParams): Promise<GetBucketReturnType> {
    // Step 1. Check if bucket exists
    if (!this.bucket) throw new Error('Database not connected')
    // Step 2. Get files
    const files = await this.bucket
      .find({
        filename,
      })
      .toArray()
    // Step 3. Check if files exists
    if (!files.length) throw new Error('File not found')
    // Step 4. Get file data
    const file = files.at(0)!
    // Step 5. Reading file using openDownloadStreamByName
    const stream = this.bucket.openDownloadStreamByName(
      file.filename
    ) as unknown as Readable
    // Step 6. Get file content type
    const contentType = file.contentType
    // Step 7. Check if stream and contentType exists
    if (!stream || !contentType) throw new Error('File not found')
    // Step 8. Return stream and contentType
    return { stream, contentType }
  }

  // PARSE FILE
  // ----------------------------------------------------------------------------
  private parseFile({ string, type, name }: PrunedFile): File {
    const buffer = Buffer.from(string, 'base64')
    // Create a File from the Blob, specifying the name and type
    return new File([buffer], name, { type })
  }
}
