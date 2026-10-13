import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────
// POST — Mark a single notification as read by ID in URL path
// ─────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        isRead: notification.isRead,
        readAt: notification.readAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('[Notifications/:id/Read] Error:', error)

    const isNotFound =
      error instanceof Error &&
      error.message.includes('Record to update not found')

    return NextResponse.json(
      {
        success: false,
        error: isNotFound ? 'Notification not found' : 'Internal server error',
      },
      { status: isNotFound ? 404 : 500 }
    )
  }
}