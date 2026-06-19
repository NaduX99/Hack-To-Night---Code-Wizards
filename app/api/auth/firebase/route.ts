import crypto from 'node:crypto'
import { ResultSetHeader } from 'mysql2'
import { verifyFirebaseIdToken } from '@/lib/firebase-admin'
import {
  asText,
  audit,
  createSessionCookie,
  hashPassword,
  query,
  queueEmail,
  readRequestBody,
  serviceFailure,
  withTransaction
} from '@/lib/platform-db'

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request)
    const idToken = asText(body.idToken).trim()

    if (!idToken) {
      return Response.json(
        { ok: false, message: 'Firebase ID token is required.' },
        { status: 400 }
      )
    }

    const decoded = await verifyFirebaseIdToken(idToken)
    const firebaseUid = decoded.uid
    const email = String(decoded.email || '')
      .trim()
      .toLowerCase()
    const fullName = String(decoded.name || email.split('@')[0] || 'Customer')
      .trim()
      .slice(0, 255)

    if (!email || decoded.email_verified === false) {
      return Response.json(
        { ok: false, message: 'Verified Google email is required.' },
        { status: 403 }
      )
    }

    const existing = await query(
      `
      SELECT id, username, role, full_name, email
      FROM users
      WHERE firebase_uid = ? OR email = ?
      LIMIT 1
      `,
      [firebaseUid, email]
    )

    let user = existing.rows[0]
    let createdAccount = false

    if (user) {
      await query(
        'UPDATE users SET firebase_uid = ?, email = ?, full_name = ? WHERE id = ?',
        [firebaseUid, email, fullName || user.full_name, user.id]
      )
      user = {
        ...user,
        email,
        full_name: fullName || user.full_name
      }
    } else {
      const username = await createUniqueUsername(email, fullName)
      const inserted = await queryInsertUser(
        username,
        fullName,
        email,
        firebaseUid
      )
      user = {
        id: inserted.insertId,
        username,
        role: 'customer',
        full_name: fullName,
        email
      }
      createdAccount = true
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role as 'admin' | 'customer',
      full_name: user.full_name,
      email: user.email
    }
    const headers = new Headers()
    headers.append('set-cookie', createSessionCookie(safeUser))

    if (createdAccount) {
      await queueEmail(
        safeUser.id,
        safeUser.email || '',
        'Welcome to Nova Bank',
        `Welcome ${safeUser.full_name}.

Your Nova Bank profile was created with Google sign-in.

Login method: Google
Email: ${safeUser.email || email}
Username: ${safeUser.username}
Next step: Add or review your banking accounts from the dashboard.`,
        {
          badge: 'Account created',
          headline: 'Your Nova Bank profile is ready',
          preheader:
            'Your Google registration is complete. Welcome to Nova Bank.',
          tone: 'welcome',
          actionLabel: 'Open dashboard',
          actionUrl: '/dashboard'
        }
      )
    }

    await queueEmail(
      safeUser.id,
      safeUser.email || '',
      'Nova Bank Google login alert',
      `Hello ${safeUser.full_name}.

Your Nova Bank account was logged in successfully.

Login method: Google
Email: ${safeUser.email || email}
Time: ${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}
Security note: If this was not you, review your Google account access and Nova Bank settings.`,
      {
        badge: 'Google sign-in',
        headline: 'New Google login to Nova Bank',
        preheader:
          'We noticed a successful Google login to your Nova Bank account.',
        tone: 'security',
        actionLabel: 'Review settings',
        actionUrl: '/settings'
      }
    )
    await audit('auth.firebase_login', {
      userId: safeUser.id,
      firebaseUid,
      email
    })

    return Response.json({ ok: true, user: safeUser }, { headers })
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : ''
    if (message.includes('Firebase Admin environment variables')) {
      return Response.json(
        { ok: false, message: 'Firebase Admin is not configured on server.' },
        { status: 503 }
      )
    }

    return serviceFailure(reason)
  }
}

async function createUniqueUsername(email: string, fullName: string) {
  const emailName = email.split('@')[0]
  const base =
    (emailName || fullName).toLowerCase().replace(/[^a-z0-9]+/g, '') ||
    'googleuser'
  let username = base.slice(0, 80)

  for (let index = 0; index < 20; index += 1) {
    const existing = await query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    )
    if (!existing.rows[0]) return username
    username = `${base.slice(0, 70)}${Math.floor(1000 + Math.random() * 9000)}`
  }

  return `${base.slice(0, 60)}${Date.now()}`
}

async function queryInsertUser(
  username: string,
  fullName: string,
  email: string,
  firebaseUid: string
) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO users (username, password, role, full_name, email, firebase_uid)
      VALUES (?, ?, 'customer', ?, ?, ?)
      `,
      [
        username,
        hashPassword(`firebase:${firebaseUid}:${crypto.randomUUID()}`),
        fullName,
        email,
        firebaseUid
      ]
    )

    return result
  })
}
