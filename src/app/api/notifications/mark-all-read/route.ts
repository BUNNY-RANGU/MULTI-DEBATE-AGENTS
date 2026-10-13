import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Accept userId from either query params or JSON body
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')

    if (!userId) {
      try {
        const body = await request.json()
        userId = body.userId
      } catch {
        // No body — that's fine, we already checked query
      }
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const now = new Date()

    const result = await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    })
  } catch (error) {
    console.error('[Notifications/MarkAllRead] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}