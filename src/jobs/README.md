# Job Scheduling with Pulse

This project uses [Pulse](https://docs-pulse.pulsecron.com/) for job scheduling. Pulse is a MongoDB-backed job scheduler that automatically manages job persistence and execution.

## Key Features

- **Self-managed schemas**: Pulse handles all database schemas automatically
- **Persistent jobs**: Jobs survive server restarts
- **Retry mechanisms**: Built-in retry logic with exponential and fixed backoff
- **Concurrency control**: Limit how many jobs run simultaneously
- **Event-driven**: React to job lifecycle events

## Creating Jobs

All jobs should be defined in the `/src/jobs` folder. To create a new job:

1. Import the Pulse instance:

```typescript
import { getPulse } from '@/mongo/pulse'
```

2. Define your job:

```typescript
const pulse = await getPulse()

pulse.define(
  'job name',
  async (job) => {
    // Your job logic here
    console.log('Job data:', job.attrs.data)
  },
  {
    priority: 'normal', // 'low', 'normal', 'high', 'highest'
    concurrency: 1, // How many can run at once
    attempts: 3, // Retry attempts on failure
    backoff: {
      type: 'exponential', // or 'fixed'
      delay: 1000, // Initial delay in ms
    },
  }
)
```

## Scheduling Jobs

### Recurring Jobs

```typescript
// Run every 5 minutes
await pulse.every('5 minutes', 'job name')

// Run at specific times (cron format)
await pulse.every('0 9 * * *', 'daily report') // Every day at 9 AM
await pulse.every('*/30 * * * *', 'sync data') // Every 30 minutes
```

### One-time Jobs

```typescript
// Run once at a specific time
await pulse.schedule('in 20 minutes', 'job name', { data: 'value' })
await pulse.schedule('at 5:00pm', 'job name')

// Run immediately
await pulse.now('job name', { urgent: true })
```

## Job Options

When defining jobs, you can specify:

- `priority`: Job priority (affects execution order)
- `concurrency`: Maximum concurrent executions
- `lockLimit`: Maximum jobs a worker can lock
- `lockLifetime`: How long a job stays locked (ms)
- `shouldSaveResult`: Save job results to database
- `attempts`: Number of retry attempts
- `backoff`: Retry delay configuration

## Accessing Job Data

Jobs can receive data when scheduled:

```typescript
// When scheduling
await pulse.now('send email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
})

// In the job handler
pulse.define('send email', async (job) => {
  const { to, subject, body } = job.attrs.data
  // Send email logic
})
```

## Managing Jobs

Pulse stores all jobs in MongoDB in the `pulseJobs` collection. Jobs persist across server restarts and will resume automatically.

To stop all jobs gracefully, the application calls `stopPulse()` on shutdown.

## Examples

See `example-jobs.ts` for comprehensive examples of:

- Simple recurring jobs
- Jobs with retry logic
- Jobs that spawn other jobs
- Complex scheduling patterns
