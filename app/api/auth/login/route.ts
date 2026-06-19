import {
  asText,
  audit,
  createSessionCookie,
  hashPassword,
  query,
  queueEmail,
  readRequestBody,
  serviceFailure,
  verifyPassword
} from '@/lib/platform-db'

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: '/api/auth/login',
    method: 'POST',
    contentTypes: ['application/json', 'application/x-www-form-urlencoded'],
    requiredFields: ['username', 'password']
  })
}

export async function POST(request: Request) {
  try {
    const clientKey =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'local-client'
    const limited = checkRateLimit(clientKey)

    if (limited) {
      return Response.json(
        { ok: false, message: 'Too many login attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await readRequestBody(request)
    const username = asText(body.username).trim()
    const password = asText(body.password)

    if (!username || !password) {
      return Response.json(
        { ok: false, message: 'Username and password are required.' },
        { status: 400 }
      )
    }

    const result = await query(
      `
      SELECT id, username, password, role, full_name, email
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
      [username]
    )
    const user = result.rows[0]

    if (!user || !verifyPassword(password, user.password)) {
      return Response.json(
        { ok: false, message: 'Invalid login.' },
        { status: 401 }
      )
    }

    if (!String(user.password).startsWith('scrypt$')) {
      await query('UPDATE users SET password = ? WHERE id = ?', [
        hashPassword(password),
        user.id
      ])
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email
    }
    const headers = new Headers()
    headers.append('set-cookie', createSessionCookie(safeUser))
    await queueEmail(
      safeUser.id,
      safeUser.email || '',
      'Nova Bank login alert',
      `Hello ${safeUser.full_name}. Your Nova Bank account was logged in successfully. If this was not you, change your password immediately.`
    )
    await audit('auth.login', {
      userId: safeUser.id,
      username: safeUser.username
    })

    return Response.json(
      {
        ok: true,
        user: safeUser
      },
      { headers }
    )
  } catch (reason) {
    return serviceFailure(reason)
  }
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = loginAttempts.get(key)

  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > MAX_ATTEMPTS
}
