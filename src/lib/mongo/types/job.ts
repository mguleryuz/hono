export enum EJobType {
  EXEMPLE_JOB = 'EXEMPLE_JOB',
}

export type JobType = keyof typeof EJobType

export interface JobSchedule {
  type: JobType
  schedule: string
}
