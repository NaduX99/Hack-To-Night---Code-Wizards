import { query, requireAuth, serviceFailure } from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const result = await query(
      `
      SELECT id, email, subject, body, status, created_at
      FROM email_notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 25
      `,
      [auth.user.id]
    )

    return Response.json({ ok: true, notifications: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
