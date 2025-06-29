import { logger } from '@/utils'
import Pulse from '@pulsecron/pulse'
import mongoose from 'mongoose'

let pulse: Pulse | null = null

/**
 * Get the Pulse instance for job scheduling
 * @returns {Promise<Pulse>} The Pulse instance
 */
export async function getPulse(): Promise<Pulse> {
  if (pulse) {
    return pulse
  }

  const mongo = mongoose.connection.db

  if (!mongo) {
    throw new Error('MongoDB connection not established')
  }

  // Create a new Pulse instance
  pulse = new Pulse({
    mongo,
    processEvery: '5 minutes',
    maxConcurrency: 20,
    defaultConcurrency: 5,
    defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
    resumeOnRestart: true,
  })

  // Set up event listeners
  pulse.on('start', (job) => {
    logger.info(`📋 Job <${job.attrs.name}> starting`)
  })

  pulse.on('success', (job) => {
    logger.info(`✅ Job <${job.attrs.name}> succeeded`)
  })

  pulse.on('fail', (error, job) => {
    logger.error(`❌ Job <${job.attrs.name}> failed:`, error)
  })

  // Start the job processor
  await pulse.start()
  logger.info('✅ Pulse job scheduler started')

  return pulse
}

/**
 * Stop the Pulse instance gracefully
 */
export async function stopPulse(): Promise<void> {
  if (pulse) {
    await pulse.stop()
    pulse = null
    logger.info('✅ Pulse job scheduler stopped')
  }
}
