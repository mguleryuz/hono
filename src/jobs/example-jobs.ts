/**
 * Example jobs demonstrating various Pulse features
 *
 * Pulse automatically manages all job schedules in MongoDB.
 * You don't need to create any schemas - Pulse handles everything.
 */

import { getPulse } from '@/mongo/helpers/pulse'

export async function setupExampleJobs() {
  const pulse = await getPulse()

  // Example 1: Simple recurring job
  pulse.define(
    'send daily report',
    async (job) => {
      console.log('Sending daily report...')
      // Your logic here
    },
    {
      priority: 'high',
      concurrency: 1,
    }
  )

  // Schedule it to run every day at 9 AM
  await pulse.every('0 9 * * *', 'send daily report')

  // Example 2: Job with data
  pulse.define(
    'send email',
    async (job) => {
      const { to, subject, body } = job.attrs.data
      console.log(`Sending email to ${to}: ${subject}`)
      // Your email sending logic here
    },
    {
      shouldSaveResult: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  )

  // Example 3: Job with retry logic
  pulse.define(
    'sync external data',
    async (job) => {
      console.log('Syncing external data...')

      // Simulate potential failure
      const random = Math.random()
      if (random < 0.3) {
        throw new Error('External API temporarily unavailable')
      }

      console.log('Data synced successfully')
    },
    {
      attempts: 5,
      backoff: {
        type: 'fixed',
        delay: 5000, // 5 seconds between retries
      },
    }
  )

  // Schedule it to run every 30 minutes
  await pulse.every('30 minutes', 'sync external data')

  // Example 4: One-time scheduled job
  pulse.define('cleanup old data', async (job) => {
    console.log('Cleaning up old data...')
    // Your cleanup logic here
  })

  // Schedule it to run once in 24 hours
  await pulse.schedule('in 24 hours', 'cleanup old data')

  // Example 5: Job that creates other jobs
  pulse.define('process batch', async (job) => {
    const { items } = job.attrs.data
    console.log(`Processing batch of ${items.length} items`)

    // Create individual jobs for each item
    for (const item of items) {
      await pulse.now('process item', { itemId: item.id })
    }
  })

  pulse.define(
    'process item',
    async (job) => {
      const { itemId } = job.attrs.data
      console.log(`Processing item ${itemId}`)
      // Your item processing logic here
    },
    {
      concurrency: 10, // Process up to 10 items concurrently
    }
  )

  // Example 6: Job with complex scheduling
  pulse.define('business hours task', async (job) => {
    console.log('Running business hours task')
    // Your business logic here
  })

  // Run every 15 minutes during business hours (9 AM - 5 PM, Monday-Friday)
  await pulse.every('*/15 9-17 * * 1-5', 'business hours task')
}
