import { model, Schema } from 'mongoose'

// ----------------------------------------------------------------------------
// JOB TYPE

export enum EJobType {
  EXEMPLE_JOB = 'EXEMPLE_JOB',
}

export type JobType = keyof typeof EJobType

// ----------------------------------------------------------------------------
// JOB SCHEDULE

export interface JobSchedule {
  type: JobType
  schedule: string
}

// ----------------------------------------------------------------------------
// SCHEMAS

export const JobScheduleSchema = new Schema<JobSchedule>({
  type: { type: String, enum: EJobType, required: true },
  schedule: { type: String, required: true },
})

// ----------------------------------------------------------------------------
// MODELS

export const JobScheduleModel = model('job-schedules', JobScheduleSchema)
