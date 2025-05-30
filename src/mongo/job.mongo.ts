import { model, Schema } from 'mongoose'

// ----------------------------------------------------------------------------
// JOB SCHEDULE

export interface JobSchedule {
  name: string
  schedule: string
}

// ----------------------------------------------------------------------------
// SCHEMAS

export const JobScheduleSchema = new Schema<JobSchedule>({
  name: { type: String, required: true },
  schedule: { type: String, required: true },
})

// ----------------------------------------------------------------------------
// MODELS

export const JobScheduleModel = model('job-schedules', JobScheduleSchema)
