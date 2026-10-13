/**
 * Email Utility Module
 *
 * In production, configure RESEND_API_KEY env var to send real emails via Resend API.
 * For now, this module logs emails to the console and stores them in a global array
 * for demo and testing purposes.
 */

interface EmailLog {
  to: string;
  subject: string;
  htmlBody: string;
  sentAt: string;
  success: boolean;
}

// Global store of sent emails for demo/query purposes
const emailLog: EmailLog[] = []

/**
 * Retrieve all logged emails (for demo/debugging purposes).
 */
export function getEmailLog(): EmailLog[] {
  return [...emailLog]
}

/**
 * Clear the email log (for testing purposes).
 */
export function clearEmailLog(): void {
  emailLog.length = 0
}

/**
 * Send an email.
 *
 * In production, configure RESEND_API_KEY env var to send real emails.
 * Without an API key, the email is logged to the console and stored in memory.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param htmlBody - HTML content of the email body
 * @returns true if the email was "sent" (logged or dispatched)
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Multi Debate Agent System <noreply@agora.app>',
          to: [to],
          subject,
          html: htmlBody,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Email] Failed to send via Resend: ${response.status} ${errorText}`)
        logEmail(to, subject, htmlBody, false)
        return false
      }

      console.log(`[Email] Sent via Resend to ${to}: ${subject}`)
      logEmail(to, subject, htmlBody, true)
      return true
    } catch (error) {
      console.error('[Email] Error calling Resend API:', error)
      logEmail(to, subject, htmlBody, false)
      return false
    }
  }

  // No API key — log the email for demo purposes
  console.log(`[Email] DEMO MODE — Email logged (not sent)`)
  console.log(`[Email]   To: ${to}`)
  console.log(`[Email]   Subject: ${subject}`)
  console.log(`[Email]   Body: ${htmlBody.substring(0, 200)}...`)

  logEmail(to, subject, htmlBody, true)
  return true
}

function logEmail(to: string, subject: string, htmlBody: string, success: boolean): void {
  emailLog.push({
    to,
    subject,
    htmlBody,
    sentAt: new Date().toISOString(),
    success,
  })
}