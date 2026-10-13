import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface PushBody {
  userId: string
  title: string
  message: string
  type?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PushBody = await request.json()

    if (!body.userId || !body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'userId, title, and message are required' },
        { status: 400 }
      )
    }

    const type = body.type || 'system'

    // 1. Fetch user to check preferences
    const user = await db.user.findUnique({
      where: { id: body.userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 2. Create the Notification record
    const notification = await db.notification.create({
      data: {
        userId: body.userId,
        type,
        title: body.title,
        message: body.message,
        sentVia: 'in_app',
      },
    })

    // 3. Send email if user has emailNotifications enabled in preferences
    let emailSent = false
    if (user.email) {
      try {
        const prefs = user.preferences ? JSON.parse(user.preferences) : {}
        if (prefs.emailNotifications !== false) {
          emailSent = await sendEmail(
            user.email,
            body.title,
            `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a1a;">${body.title}</h2>
              <p>${body.message}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
              <p style="color: #888; font-size: 12px;">This notification was sent by Multi Debate Agent System.</p>
            </div>
            `.trim()
          )
        }
      } catch {
        console.warn('[Notifications/Push] Failed to send email')
      }
    }

    return NextResponse.json(
      {
        success: true,
        notification: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          sentVia: notification.sentVia,
          createdAt: notification.createdAt.toISOString(),
        },
        emailSent,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Notifications/Push] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}