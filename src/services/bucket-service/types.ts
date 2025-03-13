import type { PrunedFile } from '@inverter-network/sdk'
import { Readable } from 'stream'

// PARAMS
// ----------------------------------------------------------------------------
export type BucketExistsParams = {
  filename: string
}

export type GetBucketParams = {
  filename: string
}

export type UploadBucketParams = {
  prunedFile: PrunedFile
}

// RETURN TYPE
// ----------------------------------------------------------------------------
export type BucketExistsReturnType = boolean

export type GetBucketReturnType = {
  stream: Readable
  contentType: string
}

export type UploadBucketReturnType =
  `${string}-${string}-${string}-${string}-${string}`
