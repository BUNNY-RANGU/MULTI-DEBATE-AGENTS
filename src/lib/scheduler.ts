/**
 * Scheduler Service
 *
 * Checks for pending ScheduledNotifications that are due and sends them.
 * Handles repeat rules (daily, weekly) by rescheduling after successful send.
 *
 * Usage:
 *   import { startScheduler, stopScheduler } from '@/lib/scheduler'
 *   startScheduler()   // call once at server startup
 *   stopScheduler()    // call on server shutdown
 */

import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

type RepeatRule = {
  type: 'once' | 'daily' | 'weekly' | 'custom'
  intervalMinutes?: number
  daysOfWeek?: number[]
}

let intervalId: ReturnType<typeof setInterval> | null = null
let isRunning = false

/**
 * Calculate the next scheduled time based on the repeat rule.
 * Returns null if the notification should not repeat (type === 'once').
 */
function getNextScheduledTime(rule: RepeatRule, baseTime: Date): Date | null {
  const next = new Date(baseTime)

  switch (rule.type) {
    case 'daily': {
      next.setDate(next.getDate() + 1)
      break
    }
    case 'weekly': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find the next matching day of week
        const currentDay = next.getDay()
        const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b)

        // Find the next day that is strictly after today
        const nextDay = sortedDays.find((d) => d > currentDay)
        if (nextDay !== undefined) {
          next.setDate(next.getDate() + (nextDay - currentDay))
        } else {
          // Wrap to next week's first matching day
          const daysUntilNext = 7 - currentDay + sortedDays[0]
          next.setDate(next.getDate() + daysUntilNext)
        }
      } else {
        // Default: next week same day
        next.setDate(next.getDate() + 7)
      }
      break
    }
    case 'custom': {
      if (rule.intervalMinutes && rule.intervalMinutes > 0) {
        next.setMinutes(next.getMinutes() + rule.intervalMinutes)
      }
      break
    }
    case 'once':
    default:
      return null
  }

  return next
}

/**
 * Process a single due scheduled notification.
 */
async function processDueNotification(schedule: {
  id: string
  userId: string
  title: string
  message: string
  scheduledAt: Date
  repeatRule: string | null
  metadata: string | null
}): Promise<void> {
  try {
    // 1. Fetch user for email
    const user = await db.user.findUnique({
      where: { id: schedule.userId },
    })

    // 2. Create the Notification record
    await db.notification.create({
      data: {
        userId: schedule.userId,
        type: 'scheduled',
        title: schedule.title,
        message: schedule.message,
        sentVia: 'in_app',
        metadata: schedule.metadata,
      },
    })

    // 3. Attempt to send email if user has email notifications enabled
    let emailSent = false
    if (user?.email) {
      try {
        const prefs = user.preferences ? JSON.parse(user.preferences) : {}
        if (prefs.emailNotifications !== false) {
          emailSent = await sendEmail(
            user.email,
            schedule.title,
            `<p>${schedule.message}</p>`
          )
        }
      } catch {
        console.error('[Scheduler] Failed to send email for schedule', schedule.id)
      }
    }

    // 4. Update the scheduled notification status
    const repeatRule: RepeatRule | null = schedule.repeatRule
      ? JSON.parse(schedule.repeatRule)
      : null

    if (repeatRule && repeatRule.type !== 'once') {
      const nextTime = getNextScheduledTime(repeatRule, schedule.scheduledAt)

      if (nextTime) {
        // Reschedule: update status to 'pending' with new scheduledAt
        await db.scheduledNotification.update({
          where: { id: schedule.id },
          data: {
            status: 'pending',
            sentAt: new Date(),
            scheduledAt: nextTime,
            updatedAt: new Date(),
          },
        })
        console.log(
          `[Scheduler] Rescheduled ${schedule.id} to ${nextTime.toISOString()}`
        )
        return
      }
    }

    // No repeat — mark as sent
    await db.scheduledNotification.update({
      where: { id: schedule.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log(
      `[Scheduler] Sent scheduled notification ${schedule.id} (email: ${emailSent})`
    )
  } catch (error) {
    console.error(`[Scheduler] Failed to process schedule ${schedule.id}:`, error)

    // Mark as failed
    try {
      await db.scheduledNotification.update({
        where: { id: schedule.id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      })
    } catch {
      // Ignore update errors
    }
  }
}

/**
 * Check for due notifications and process them.
 */
async function tick(): Promise<void> {
  if (isRunning) return
  isRunning = true

  try {
    const now = new Date()
    const lookAhead = new Date(now.getTime() + 60_000) // next 1 minute

    const dueNotifications = await db.scheduledNotification.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: lookAhead,
        },
      },
    })

    if (dueNotifications.length > 0) {
      console.log(
        `[Scheduler] Found ${dueNotifications.length} due notification(s)`
      )

      for (const notification of dueNotifications) {
        await processDueNotification(notification)
      }
    }
  } catch (error) {
    console.error('[Scheduler] Tick error:', error)
  } finally {
    isRunning = false
  }
}

/**
 * Start the scheduler. Runs an immediate check and then polls every 30 seconds.
 */
export function startScheduler(): void {
  if (intervalId !== null) {
    console.log('[Scheduler] Already running')
    return
  }

  console.log('[Scheduler] Starting scheduler (30s interval)')

  // Initial check
  tick()

  // Poll every 30 seconds
  intervalId = setInterval(tick, 30_000)
}

/**
 * Stop the scheduler.
 */
export function stopScheduler(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
    console.log('[Scheduler] Stopped')
  }
}

// Auto-start the scheduler when this module is first imported (server-side only)
if (typeof window === 'undefined') {
  startScheduler()
}