import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface MarkReadBody {
  notificationId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MarkReadBody = await request.json()

    if (!body.notificationId || typeof body.notificationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.update({
      where: { id: body.notificationId },
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
    console.error('[Notifications/MarkRead] Error:', error)

    // Prisma throws P2025 if record not found
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