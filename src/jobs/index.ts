/**
 * You can start adding your job tasks to the @/jobs folder.
 * import the tasks and define them in the constructor of the Jobs class.
 *
 * Pulse will manage all job schedules in the database automatically.
 */

import { getPulse } from '@/mongo'

export class Jobs {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const pulse = await getPulse()

      // Define the example job
      pulse.define(
        'EXAMPLE_JOB',
        async (job) => {
          console.log('Hello, world!', new Date().toISOString())
          // Add your job logic here
        },
        {
          priority: 'normal',
          concurrency: 1,
        }
      )

      // Schedule the job to run every hour
      await pulse.every('0 * * * *', 'EXAMPLE_JOB')

      // You can also schedule jobs with other patterns:
      // await pulse.every('5 minutes', 'EXAMPLE_JOB')
      // await pulse.schedule('in 20 minutes', 'EXAMPLE_JOB', { someData: 'value' })
      // await pulse.now('EXAMPLE_JOB', { someData: 'value' })

      console.log('✅ Jobs initialized with Pulse')
    } catch (error) {
      console.error('❌ Failed to initialize jobs:', error)
    }
  }
}
