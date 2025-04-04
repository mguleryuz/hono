/**
 * You can start adding your job tasks to the @/jobs folder.
 * import the tasks and run them in the constructor of the Jobs class.
 *
 */

import { Cron } from 'croner'
import { JobManager } from '@/mongo'

const managerInstance = JobManager.getInstance()

export class Jobs {
  constructor() {
    // Place your jobs here i.e.
    new Cron('0 * * * *', () => {
      console.log('Hello, world!')
    })
    // Or use the JobManager instance
    // ( this instance enables you to update the schedule of the job, via a api call )
    managerInstance.startJob({
      type: 'EXEMPLE_JOB',
      schedule: '0 * * * *',
      task: () => {
        console.log('Hello, world!')
      },
    })
  }
}
