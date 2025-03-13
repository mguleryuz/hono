import { model } from 'mongoose'
import { JobScheduleSchema } from '@/lib/mongo/schemas'

export const JobScheduleModel = model('job-schedules', JobScheduleSchema)
