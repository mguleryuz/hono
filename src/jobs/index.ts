/**
 * You can start adding your job tasks to the @/jobs folder.
 * import the tasks and define them in the constructor of the Jobs class.
 *
 * Pulse will manage all job schedules in the database automatically.
 */

import { logger } from '@/utils'
import Pulse from '@pulsecron/pulse'
import mongoose from 'mongoose'

export interface JobsConfig {
  processEvery?: string
  maxConcurrency?: number
  defaultConcurrency?: number
  defaultLockLifetime?: number
  resumeOnRestart?: boolean
}

export class Jobs {
  private _pulse: Pulse | null = null

  get pulse() {
    if (!this._pulse) {
      throw new Error('Pulse not initialized')
    }

    return this._pulse
  }

  constructor(private config: JobsConfig = {}) {
    this.initialize()
    this.setupGracefulShutdown()
  }

  private setupGracefulShutdown() {
    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server')
      await this._pulse?.stop()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server')
      await this._pulse?.stop()
      process.exit(0)
    })
  }

  private async defineJobs() {
    // -- Process campaigns job --
    this.pulse.define(
      'example job',
      async () => {
        console.log('example job')
      },
      {
        priority: 'normal',
        concurrency: 1,
      }
    )

    // every hour
    await this.pulse.every('0 * * * *', 'example job')
  }

  private async initialize() {
    try {
      const mongo = mongoose.connection.db

      if (!mongo) {
        throw new Error('MongoDB connection not established')
      }

      // Create Pulse instance with configurable options
      this._pulse = new Pulse({
        mongo,
        processEvery: this.config.processEvery || '5 minutes',
        maxConcurrency: this.config.maxConcurrency || 20,
        defaultConcurrency: this.config.defaultConcurrency || 5,
        defaultLockLifetime: this.config.defaultLockLifetime || 10 * 60 * 1000, // 10 minutes
        resumeOnRestart: this.config.resumeOnRestart ?? true,
      })

      // Set up event listeners
      this.pulse.on('start', (job) => {
        logger.info(`📋 Job <${job.attrs.name}> starting`)
      })

      this.pulse.on('success', (job) => {
        logger.info(`✅ Job <${job.attrs.name}> succeeded`)
      })

      this.pulse.on('fail', (error, job) => {
        logger.error(`❌ Job <${job.attrs.name}> failed:`, error)
      })

      // Start the job processor
      await this.pulse.start()
      logger.info('✅ Pulse job scheduler started')

      await this.defineJobs()

      // You can also schedule jobs with other patterns:
      // await this.pulse.every('5 minutes', 'EXAMPLE_JOB')
      // await this.pulse.schedule('in 20 minutes', 'EXAMPLE_JOB', { someData: 'value' })
      // await this.pulse.now('EXAMPLE_JOB', { someData: 'value' })

      logger.info('✅ Jobs initialized with Pulse')
    } catch (error) {
      logger.error('❌ Failed to initialize jobs:', error)
      throw error
    }
  }
}
