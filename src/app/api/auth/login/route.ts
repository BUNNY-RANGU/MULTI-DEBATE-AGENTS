import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface LoginBody {
  email: string
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()

    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const email = body.email.trim().toLowerCase()
    const name = body.name?.trim() || null

    // Upsert user by email
    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        lastLoginAt: new Date(),
        loginCount: 1,
      },
      update: {
        name: name ?? undefined,
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    })

    // Create a login notification record
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'login_alert',
        title: 'New Login Detected',
        message: `A new login was recorded for your account at ${new Date().toISOString()}.`,
        sentVia: 'in_app',
      },
    })

    // Attempt to send login email (best-effort, don't fail the request)
    try {
      await sendEmail(
        user.email,
        'New Login to Multi Debate Agent System',
        `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a;">New Login to Multi Debate Agent System</h2>
          <p>Hello${user.name ? ' ' + user.name : ''},</p>
          <p>A new login was detected for your account:</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Time:</strong> ${new Date().toISOString()}</li>
            <li><strong>Login Count:</strong> ${user.loginCount}</li>
          </ul>
          <p>If this was not you, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #888; font-size: 12px;">This is an automated message from Multi Debate Agent System.</p>
        </div>
        `.trim()
      )
    } catch {
      // Email send failure should not block the login response
      console.warn('[Auth/Login] Failed to send login email')
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        loginCount: user.loginCount,
      },
    })
  } catch (error) {
    console.error('[Auth/Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}