import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────
// DELETE — Cancel a scheduled notification by ID in URL path
// ─────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const schedule = await db.scheduledNotification.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        status: schedule.status,
        updatedAt: schedule.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Notifications/Schedule/:id] DELETE error:', error)

    const isNotFound =
      error instanceof Error &&
      error.message.includes('Record to update not found')

    return NextResponse.json(
      {
        success: false,
        error: isNotFound ? 'Scheduled notification not found' : 'Internal server error',
      },
      { status: isNotFound ? 404 : 500 }
    )
  }
}