import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────
// POST — Create a new scheduled notification
// ─────────────────────────────────────────────────────────

interface ScheduleBody {
  userId: string
  title: string
  message: string
  scheduledAt: string
  repeatRule?: string // Can be: "once" | "daily" | "weekly:Mon,Wed" | "every_60_min"
  metadata?: Record<string, unknown>
}

function parseRepeatRule(raw: string | undefined): { type: string; intervalMinutes?: number; daysOfWeek?: string[] } | null {
  if (!raw || raw === 'once') return null

  // "daily"
  if (raw === 'daily') return { type: 'daily' }

  // "weekly:Mon,Wed,Fri"
  if (raw.startsWith('weekly:')) {
    const days = raw.slice(7).split(',').map(d => d.trim()).filter(Boolean)
    return { type: 'weekly', daysOfWeek: days }
  }

  // "every_60_min"
  const customMatch = raw.match(/^every_(\d+)_min$/)
  if (customMatch) {
    return { type: 'custom', intervalMinutes: parseInt(customMatch[1], 10) }
  }

  // Fallback: treat as object JSON
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleBody = await request.json()

    if (!body.userId || !body.title || !body.message || !body.scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, title, message, and scheduledAt are required',
        },
        { status: 400 }
      )
    }

    const scheduledAt = new Date(body.scheduledAt)
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'scheduledAt must be a valid ISO date string' },
        { status: 400 }
      )
    }

    const repeatRule = parseRepeatRule(body.repeatRule)
    const repeatRuleStr = repeatRule ? JSON.stringify(repeatRule) : null
    const metadataStr = body.metadata ? JSON.stringify(body.metadata) : null

    const schedule = await db.scheduledNotification.create({
      data: {
        userId: body.userId,
        title: body.title,
        message: body.message,
        scheduledAt,
        repeatRule: repeatRuleStr,
        metadata: metadataStr,
      },
    })

    return NextResponse.json(
      {
        success: true,
        schedule: {
          id: schedule.id,
          userId: schedule.userId,
          title: schedule.title,
          message: schedule.message,
          scheduledAt: schedule.scheduledAt.toISOString(),
          sentAt: schedule.sentAt?.toISOString() ?? null,
          status: schedule.status,
          repeatRule: schedule.repeatRule,
          metadata: schedule.metadata,
          createdAt: schedule.createdAt.toISOString(),
          updatedAt: schedule.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Notifications/Schedule] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────
// GET — List scheduled notifications for a user
// ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const schedules = await db.scheduledNotification.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json(
      schedules.map((s) => ({
        id: s.id,
        userId: s.userId,
        title: s.title,
        message: s.message,
        scheduledAt: s.scheduledAt.toISOString(),
        sentAt: s.sentAt?.toISOString() ?? null,
        status: s.status,
        repeatRule: s.repeatRule,
        metadata: s.metadata,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('[Notifications/Schedule] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}