import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// Auto-start the scheduler on first import (server-side only)
import '@/lib/scheduler'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unread = searchParams.get('unread')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const whereClause: Record<string, unknown> = { userId }
    if (unread === 'true') {
      whereClause.isRead = false
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ])

    // If ?unread=true, return just the count
    if (unread === 'true') {
      return NextResponse.json({ count: unreadCount })
    }

    // Return notifications as a flat array (frontend expects array or { notifications, count })
    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        metadata: n.metadata,
        sentVia: n.sentVia,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('[Notifications] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}