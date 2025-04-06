import { getTwitterUsersToMonitor } from '@/utils'

import { logger } from '@/utils'

import { getOrigin } from '@/utils'
import { socialdataService } from '@/index'

export async function registerTweetMonitors() {
  const origin = getOrigin()

  if (!origin) {
    logger.warn('No origin found, skipping tweet monitor registration')
    return
  }

  if (origin.startsWith('http://localhost')) {
    logger.info('Not registering tweet monitors on localhost')
    return
  }

  const webhookUrl = `${origin}/api/user-tweets-webhook`

  const activeMonitors = await socialdataService.getActiveMonitors()
  const usersToMonitor = getTwitterUsersToMonitor()

  // Register monitors for each user, if they don't already have one
  for (const user of usersToMonitor) {
    if (
      activeMonitors.data.some(
        (monitor) => monitor.parameters.user_screen_name === user
      )
    ) {
      logger.info(`User ${user} already has a monitor, skipping...`)
      continue
    }

    await socialdataService.createUserTweetsMonitor(user, webhookUrl)
  }

  let deletedMonitors: string[] = []

  // Delete monitors for users that are not in the usersToMonitor array
  for (const monitor of activeMonitors.data) {
    if (!usersToMonitor.includes(monitor.parameters.user_screen_name)) {
      await socialdataService.deleteMonitor(monitor.id)
      deletedMonitors.push(monitor.id)
    }
  }

  // If the monitor has a different webhook url, patch it
  for (const monitor of activeMonitors.data) {
    if (deletedMonitors.includes(monitor.id)) {
      continue
    }

    if (monitor.webhook_url !== webhookUrl) {
      await socialdataService.patchMonitor(monitor.id, {
        webhook_url: webhookUrl,
      })
    }
  }
}
