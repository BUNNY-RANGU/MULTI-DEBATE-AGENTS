import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface AdminSendBody {
  targetMode: 'all' | 'user'
  userId?: string
  title: string
  message: string
  type?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminSendBody = await request.json()

    if (!body.targetMode || !body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'targetMode, title, and message are required' },
        { status: 400 }
      )
    }

    if (body.targetMode !== 'all' && body.targetMode !== 'user') {
      return NextResponse.json(
        { success: false, error: 'targetMode must be "all" or "user"' },
        { status: 400 }
      )
    }

    if (body.targetMode === 'user' && !body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required when targetMode is "user"' },
        { status: 400 }
      )
    }

    const type = body.type || 'system'
    const title = body.title.trim()
    const message = body.message.trim()

    // Fetch target users
    const users = body.targetMode === 'all'
      ? await db.user.findMany({ where: { isActive: true } })
      : [await db.user.findUnique({ where: { id: body.userId! } })].filter(Boolean)

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: body.targetMode === 'all' ? 'No active users found' : 'User not found' },
        { status: 404 }
      )
    }

    let sentCount = 0

    // Create notifications and attempt emails for each user
    await Promise.all(
      users.map(async (user) => {
        // Create in-app notification
        await db.notification.create({
          data: {
            userId: user!.id,
            type,
            title,
            message,
            sentVia: 'in_app',
          },
        })

        // Best-effort email
        if (user!.email) {
          try {
            const prefs = user!.preferences ? JSON.parse(user!.preferences) : {}
            if (prefs.emailNotifications !== false) {
              await sendEmail(
                user!.email,
                title,
                `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #1a1a1a;">${title}</h2>
                  <p>${message}</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
                  <p style="color: #888; font-size: 12px;">This notification was sent by Multi Debate Agent System Admin.</p>
                </div>
                `.trim()
              )
            }
          } catch {
            console.warn(`[Admin/Send] Failed to send email to ${user!.email}`)
          }
        }

        sentCount++
      })
    )

    return NextResponse.json({ success: true, sentCount }, { status: 200 })
  } catch (error) {
    console.error('[Admin/Send] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}