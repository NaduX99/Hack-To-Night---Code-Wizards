import {
  asText,
  audit,
  query,
  queueEmail,
  readRequestBody,
  requireAuth,
  serviceFailure
} from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const result = await query(
      `
      SELECT id, username, role, full_name, nic, email, avatar_url, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [auth.user.id]
    )

    return Response.json({ ok: true, profile: result.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const fullName = asText(body.fullName || body.full_name).trim()
    const email = asText(body.email).trim().toLowerCase()
    const nic = asText(body.nic).trim()
    const avatarUrl = asText(body.avatarUrl || body.avatar_url)
      .trim()
      .slice(0, 500)

    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { ok: false, message: 'Valid full name and email are required.' },
        { status: 400 }
      )
    }

    await query(
      `
      UPDATE users
      SET full_name = ?, email = ?, nic = ?, avatar_url = ?
      WHERE id = ?
      `,
      [fullName, email, nic, avatarUrl, auth.user.id]
    )
    await queueEmail(
      auth.user.id,
      email,
      'Nova Bank profile updated',
      'Your Nova Bank profile details were updated successfully.'
    )
    await audit('profile.update', { userId: auth.user.id })

    return Response.json({
      ok: true,
      message: 'Profile updated successfully.'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
