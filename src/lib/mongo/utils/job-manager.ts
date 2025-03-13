import { JobScheduleModel, type JobType } from '@/lib/mongo'
import { Cron, scheduledJobs } from 'croner'

/** Configuration for a scheduled job */
export type JobConfig = {
  /** Cron schedule string. If not provided, will attempt to load from database */
  schedule?: string
  /** Unique identifier for the job type */
  type: JobType
  /** Async function to execute when job runs */
  task: () => Promise<void | null> | null | void
}

/**
 * Manages scheduled jobs using cron expressions
 */
export class JobManager {
  private static instance: JobManager | null = null

  /**
   * Gets the singleton instance of JobManager
   */
  public static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager()
    }
    return JobManager.instance
  }

  // PUBLIC METHODS

  /**
   * Starts a new scheduled job
   * @param config - Job configuration
   * @returns The created cron job instance
   * @throws Error if schedule is missing or invalid
   */
  public async startJob({
    type,
    schedule: initialSchedule = '0 */12 * * *',
    task,
  }: JobConfig): Promise<Cron> {
    // Find existing job
    const job = this.findJob(type)

    // Stop existing job if it's running
    if (!!job && job.isRunning()) {
      console.log(`Stopping job "${type}"`)
      job.stop()
    }

    // Get schedule from database or use initial schedule
    const schedule = (await this.getSavedSchedule(type)) ?? initialSchedule

    // Validate schedule
    if (!schedule) {
      throw new Error(`No schedule found for job "${type}"`)
    }
    if (!this.validateSchedule(schedule)) {
      throw new Error(`Invalid schedule format "${schedule}" for job "${type}"`)
    }

    // Create new cron job
    console.log(`Starting job "${type}" with schedule "${schedule}"`)
    const cronJob = new Cron(
      schedule,
      {
        name: type,
        timezone: 'UTC',
        protect: true,
        maxRuns: Infinity,
        catch: (error) => {
          console.error(`Error in job "${type}":`, error)
        },
      },
      async () => {
        try {
          await task()
          console.log(`Job "${type}" completed successfully`)
        } catch (error) {
          console.error(`Job "${type}" failed:`, error)
        }
      }
    )

    return cronJob
  }

  /**
   * Starts multiple jobs
   * @param jobs - Array of job configurations
   */
  public async startAllJobs(jobs: JobConfig[]): Promise<Cron[]> {
    const results: Cron[] = []
    for (const job of jobs) {
      const result = await this.startJob(job)
      results.push(result)
    }
    console.log('Started all jobs')
    return results
  }

  /**
   * Pauses a running job
   * @param jobName - Name of the job to pause
   * @returns true if job was paused successfully
   */
  public pauseJob(jobName: string): boolean {
    const job = this.findJob(jobName)
    if (job && job.isRunning()) {
      const result = job.pause()
      console.log(`Pausing job "${jobName}": ${result ? 'success' : 'failed'}`)
      return result
    } else {
      console.warn(`No running job found with name "${jobName}"`)
      return false
    }
  }

  /**
   * Pauses all running jobs
   * @returns Array of pause operation results
   */
  public pauseAllJobs(): boolean[] {
    const results: boolean[] = []
    for (const job of scheduledJobs) {
      if (!job.name) continue
      results.push(this.pauseJob(job.name))
    }
    console.log('Paused all jobs')
    return results
  }

  /**
   * Resumes a paused job
   * @param jobName - Name of the job to resume
   * @returns true if job was resumed successfully
   */
  public resumeJob(jobName: string): boolean {
    const job = this.findJob(jobName)
    if (job && !job.isRunning()) {
      const result = job.resume()
      console.log(`Resuming job "${jobName}": ${result ? 'success' : 'failed'}`)
      return result
    } else {
      console.warn(`No paused job found with name "${jobName}"`)
      return false
    }
  }

  /**
   * Resumes all paused jobs
   * @returns Array of resume operation results
   */
  public resumeAllJobs(): boolean[] {
    const results: boolean[] = []
    for (const job of scheduledJobs) {
      if (!job.name) continue
      results.push(this.resumeJob(job.name))
    }
    results.length && console.log('Resumed all jobs')
    return results
  }

  /**
   * Stops a running job
   * @param jobName - Name of the job to stop
   */
  public stopJob(jobName: string): void {
    const job = this.findJob(jobName)

    if (job && job.isRunning()) {
      job.stop()
      console.log(`Job "${jobName}" stopped`)
    } else {
      console.warn(`No running job found with name "${jobName}"`)
    }
  }

  /**
   * Stops all running jobs
   */
  public stopAllJobs(): void {
    for (const job of scheduledJobs) {
      if (!job.name) continue
      this.stopJob(job.name)
    }
    console.log('Stopped all jobs')
  }

  // PRIVATE METHODS

  /**
   * Finds a job by name in the scheduled jobs list
   * @param jobName - Name of the job to find
   * @returns The cron job if found, null otherwise
   */
  private findJob(jobName: string): Cron | null {
    return scheduledJobs.find((job) => job.name === jobName) ?? null
  }

  /**
   * Retrieves saved schedule for a job type from database
   * @param jobType - Type of job to look up
   * @returns Saved schedule string if found, null otherwise
   */
  private async getSavedSchedule(jobType: JobType): Promise<string | null> {
    const jobSchedule = await JobScheduleModel.findOne({
      jobType,
    })

    return jobSchedule?.schedule ?? null
  }

  /**
   * Validates if a schedule string is a valid cron expression
   * @param schedule - Schedule string to validate
   * @returns true if schedule is valid
   */
  private validateSchedule(schedule: string): boolean {
    try {
      new Cron(schedule)
      return true
    } catch {
      return false
    }
  }
}
