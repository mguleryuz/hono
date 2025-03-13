import type { JobSchedule } from '@/lib/mongo/types'

import { EJobType } from '@/lib/mongo/types'
import { Schema } from 'mongoose'

export const JobScheduleSchema = new Schema<JobSchedule>({
  type: { type: String, enum: EJobType, required: true },
  schedule: { type: String, required: true },
})
