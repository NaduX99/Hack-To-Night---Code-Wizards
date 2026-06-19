import crypto from 'node:crypto'
import mysql from 'mysql2/promise'
import nodemailer from 'nodemailer'

const connectionString =
  process.env.DATABASE_URL ||
  'mysql://htn26user:supersecurepassword@localhost:3306/htn26db'

const sessionSecret =
  process.env.SESSION_SECRET ||
  'development-only-change-this-session-secret-before-production'

const mysqlPool = mysql.createPool({
  uri: connectionString,
  connectionLimit: 3,
  namedPlaceholders: false,
  multipleStatements: false
})

type QueryValue = string | number | boolean | null
type EmailOptions = {
  preheader?: string
  headline?: string
  badge?: string
  tone?: 'security' | 'welcome' | 'transaction' | 'notice'
  actionLabel?: string
  actionUrl?: string
}
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export type AuthUser = {
  id: number
  username: string
  role: 'admin' | 'customer'
  full_name: string
  email: string | null
}

export const pool = {
  async query(
    sql: string,
    params: QueryValue[] = []
  ): Promise<{ rows: any[] }> {
    const [rows] = await mysqlPool.execute(sql, params)
    return { rows: Array.isArray(rows) ? rows : [] }
  }
}

let booted = false

const schema = [
  `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  full_name VARCHAR(255) NOT NULL,
  nic VARCHAR(50),
  email VARCHAR(255),
  avatar_url VARCHAR(500),
  firebase_uid VARCHAR(128) UNIQUE,
  totp_secret VARCHAR(64),
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL DEFAULT 'Main Branch',
  balance DECIMAL(14, 2) NOT NULL DEFAULT 100000.00,
  pin VARCHAR(20) NOT NULL DEFAULT '0000',
  CONSTRAINT accounts_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
)`,
  `
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_account VARCHAR(50) NOT NULL,
  to_account VARCHAR(50) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  description TEXT,
  purpose VARCHAR(255),
  category VARCHAR(100) NOT NULL DEFAULT 'Transfers',
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  payload JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS email_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS bill_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  biller_id VARCHAR(100) NOT NULL,
  biller_name VARCHAR(255) NOT NULL,
  bill_id VARCHAR(100) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  remarks TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL,
  spent_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  period VARCHAR(50) NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS savings_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL,
  saved_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  daily_saving_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `
CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL DEFAULT 'Nova Bank',
  nickname VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY beneficiaries_user_account_unique (user_id, account_number),
  CONSTRAINT beneficiaries_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
)`
]

const seedUsers = [
  [
    1,
    'dilara',
    'password123',
    'customer',
    'Dilara Perera',
    '200112345678',
    'dilara@example.test'
  ],
  [
    2,
    'kasun',
    'kasun',
    'customer',
    'Kasun Wickramanayake',
    '199812345678',
    'kasun@example.test'
  ],
  [
    3,
    'admin',
    'admin',
    'admin',
    'Platform Administrator',
    '000000000000',
    'root@example.test'
  ]
] as const

const seedStatements = [
  `
INSERT INTO accounts (user_id, account_number, account_name, branch, balance, pin) VALUES
  (1, '1000003423', 'Dilara Savings', 'Colombo Main', 100000.00, '1234'),
  (1, '1000004876', 'Dilara Expenses', 'Colombo Main', 42000.00, '1234'),
  (2, '2000006754', 'Kasun Current', 'Kandy', 9870.00, '0000'),
  (3, '9999999999', 'Admin Vault', 'Head Office', 9999999.99, '9999')
ON DUPLICATE KEY UPDATE account_number = account_number`,
  `
INSERT INTO transactions (id, from_account, to_account, amount, description, created_by) VALUES
  (1, '1000003423', '2000006754', 4500.00, 'Lunch money', 1),
  (2, '1000004876', '9999999999', 10000.00, 'Totally normal fee', 1),
  (3, '2000006754', '1000003423', 9870.00, 'Refund maybe', 2)
ON DUPLICATE KEY UPDATE id = id`
]

export async function query(sql: string, params: QueryValue[] = []) {
  await ensureDatabase()
  return pool.query(sql, params)
}

export async function withTransaction<T>(
  work: (connection: mysql.PoolConnection) => Promise<T>
) {
  await ensureDatabase()
  const connection = await mysqlPool.getConnection()

  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function ensureDatabase() {
  if (booted) return

  for (const statement of schema) {
    await pool.query(statement)
  }

  await ensureColumn(
    'accounts',
    'branch',
    "ALTER TABLE accounts ADD COLUMN branch VARCHAR(255) NOT NULL DEFAULT 'Main Branch' AFTER account_name"
  )
  await ensureColumn(
    'transactions',
    'purpose',
    'ALTER TABLE transactions ADD COLUMN purpose VARCHAR(255) AFTER description'
  )
  await ensureColumn(
    'transactions',
    'category',
    "ALTER TABLE transactions ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Transfers' AFTER purpose"
  )
  await ensureColumn(
    'users',
    'avatar_url',
    'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) AFTER email'
  )
  await ensureColumn(
    'users',
    'firebase_uid',
    'ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE AFTER avatar_url'
  )
  await ensureColumn(
    'users',
    'totp_secret',
    'ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64) AFTER firebase_uid'
  )
  await ensureColumn(
    'users',
    'totp_enabled',
    'ALTER TABLE users ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER totp_secret'
  )
  await ensureTable('email_notifications', schema[4])
  await ensureTable('bill_payments', schema[5])
  await ensureTable('budgets', schema[6])
  await ensureTable('savings_goals', schema[7])
  await ensureTable('beneficiaries', schema[8])
  await ensureColumn(
    'savings_goals',
    'daily_saving_amount',
    'ALTER TABLE savings_goals ADD COLUMN daily_saving_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 AFTER saved_amount'
  )

  for (const user of seedUsers) {
    await pool.query(
      `
      INSERT INTO users (id, username, password, role, full_name, nic, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = id
      `,
      [
        user[0],
        user[1],
        hashPassword(user[2]),
        user[3],
        user[4],
        user[5],
        user[6]
      ]
    )
  }

  for (const statement of seedStatements) {
    await pool.query(statement)
  }

  booted = true
}

async function ensureTable(table: string, createSql: string) {
  const existing = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    LIMIT 1
    `,
    [table]
  )

  if (!existing.rows[0]) {
    await pool.query(createSql)
  }
}

async function ensureColumn(table: string, column: string, alterSql: string) {
  const existing = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    LIMIT 1
    `,
    [table, column]
  )

  if (!existing.rows[0]) {
    await pool.query(alterSql)
  }
}

export async function queueEmail(
  userId: number | null,
  email: string,
  subject: string,
  body: string,
  options: EmailOptions = {}
) {
  if (!email) return

  const status = process.env.SMTP_HOST ? 'queued' : 'outbox_only'

  await ensureDatabase()
  const [inserted] = await mysqlPool.execute<mysql.ResultSetHeader>(
    `
    INSERT INTO email_notifications (user_id, email, subject, body, status)
    VALUES (?, ?, ?, ?, ?)
    `,
    [userId, email, subject, body, status]
  )

  if (!process.env.SMTP_HOST) return

  try {
    await sendEmail(email, subject, body, options)
    await pool.query('UPDATE email_notifications SET status = ? WHERE id = ?', [
      'sent',
      inserted.insertId
    ])
  } catch (error) {
    console.error('[email-send-error]', error)
    await pool.query('UPDATE email_notifications SET status = ? WHERE id = ?', [
      'failed',
      inserted.insertId
    ])
  }
}

export async function audit(event: string, payload: Record<string, unknown>) {
  await query('INSERT INTO audit_logs (event, payload) VALUES (?, ?)', [
    event,
    JSON.stringify(payload)
  ])
}

export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export async function readRequestBody(request: Request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}))
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData().catch(() => null)
    if (!form) return {}

    return Object.fromEntries(form.entries())
  }

  const text = await request.text().catch(() => '')
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return Object.fromEntries(new URLSearchParams(text))
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${key}`
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith('scrypt$')) {
    return password === stored
  }

  const [, salt, key] = stored.split('$')
  if (!salt || !key) return false

  const candidate = crypto.scryptSync(password, salt, 64)
  const known = Buffer.from(key, 'hex')

  return (
    known.length === candidate.length &&
    crypto.timingSafeEqual(known, candidate)
  )
}

export function generateTotpSecret() {
  const bytes = crypto.randomBytes(20)
  let bits = ''

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0')
  }

  let secret = ''
  for (let index = 0; index + 5 <= bits.length; index += 5) {
    secret += base32Alphabet[Number.parseInt(bits.slice(index, index + 5), 2)]
  }

  return secret
}

export function buildTotpUri(secret: string, username: string) {
  const issuer = 'Nova Bank'
  const label = encodeURIComponent(`${issuer}:${username}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  })

  return `otpauth://totp/${label}?${params.toString()}`
}

export function verifyTotp(secret: string, code: string) {
  const normalized = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  const counter = Math.floor(Date.now() / 1000 / 30)
  for (let offset = -1; offset <= 1; offset += 1) {
    if (generateTotpCode(secret, counter + offset) === normalized) {
      return true
    }
  }

  return false
}

export function createSessionCookie(user: AuthUser) {
  const header = Buffer.from(
    JSON.stringify({
      alg: 'HS256',
      typ: 'JWT'
    })
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(user.id),
      id: user.id,
      role: user.role,
      name: user.full_name,
      exp: Date.now() + 1000 * 60 * 60 * 8
    })
  ).toString('base64url')
  const unsigned = `${header}.${payload}`
  const signature = sign(unsigned)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  return `session=${unsigned}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`
}

export async function getCurrentUser(
  request: Request
): Promise<AuthUser | null> {
  const session = getCookie(request, 'session')
  if (!session) return null

  const [header, payload, signature] = session.split('.')
  if (
    !header ||
    !payload ||
    !signature ||
    !verifySignature(`${header}.${payload}`, signature)
  ) {
    return null
  }

  const parsed = parseSessionPayload(payload)
  if (!parsed) return null

  if (!parsed.id || !parsed.exp || parsed.exp < Date.now()) return null

  const result = await query(
    'SELECT id, username, role, full_name, email FROM users WHERE id = ? LIMIT 1',
    [parsed.id]
  )

  return result.rows[0] ?? null
}

export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request)

  if (!user) {
    return {
      user: null,
      response: Response.json(
        { ok: false, message: 'Authentication required.' },
        { status: 401 }
      )
    }
  }

  return { user, response: null }
}

export async function requireAdmin(request: Request) {
  const auth = await requireAuth(request)
  if (auth.response || !auth.user) return auth

  if (auth.user.role !== 'admin') {
    return {
      user: auth.user,
      response: Response.json(
        { ok: false, message: 'Admin access required.' },
        { status: 403 }
      )
    }
  }

  return auth
}

export function serviceFailure(reason: unknown) {
  const issue = reason as { code?: string }

  console.error('[bank-api-error]', reason)

  return Response.json(
    {
      ok: false,
      message: 'Service temporarily unavailable.',
      code: issue.code
    },
    { status: 500 }
  )
}

function getCookie(request: Request, name: string) {
  const cookies = request.headers.get('cookie') || ''
  const match = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : ''
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', sessionSecret)
    .update(value)
    .digest('base64url')
}

function verifySignature(value: string, signature: string) {
  const known = Buffer.from(sign(value))
  const candidate = Buffer.from(signature)

  return (
    known.length === candidate.length &&
    crypto.timingSafeEqual(known, candidate)
  )
}

function parseSessionPayload(payload: string) {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      id?: number
      role?: string
      exp?: number
    }
  } catch {
    return null
  }
}

function generateTotpCode(secret: string, counter: number) {
  const key = decodeBase32(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(binary % 1_000_000).padStart(6, '0')
}

function decodeBase32(secret: string) {
  const cleaned = secret.toUpperCase().replace(/=+$/, '')
  let bits = ''

  for (const char of cleaned) {
    const value = base32Alphabet.indexOf(char)
    if (value === -1) continue
    bits += value.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmailHtml(subject: string, body: string, options: EmailOptions) {
  const tone = options.tone || 'notice'
  const accent =
    tone === 'welcome'
      ? '#34d399'
      : tone === 'transaction'
        ? '#22d3ee'
        : tone === 'security'
          ? '#fbbf24'
          : '#34d399'
  const badge = escapeHtml(options.badge || 'Nova Bank')
  const headline = escapeHtml(options.headline || subject)
  const preheader = escapeHtml(
    options.preheader || 'A secure update from your Nova Bank account.'
  )
  const rows = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(':')
      if (separator > 0 && separator < 36) {
        const label = escapeHtml(line.slice(0, separator))
        const value = escapeHtml(line.slice(separator + 1).trim())
        return `<tr><td style="padding:10px 14px;color:#8aa39c;font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid rgba(52,211,153,.14);">${label}</td><td style="padding:10px 14px;color:#ecfeff;font-weight:700;text-align:right;border-bottom:1px solid rgba(52,211,153,.14);">${value}</td></tr>`
      }

      return `<p style="margin:0 0 14px;color:#cde8e1;font-size:15px;line-height:1.7;">${escapeHtml(line)}</p>`
    })

  const detailRows = rows.filter((row) => row.startsWith('<tr>')).join('')
  const paragraphs = rows.filter((row) => row.startsWith('<p')).join('')
  const actionUrl = options.actionUrl?.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}${options.actionUrl}`
    : options.actionUrl
  const action =
    options.actionLabel && actionUrl
      ? `<a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:22px;padding:13px 22px;border-radius:999px;background:${accent};color:#04130f;text-decoration:none;font-weight:800;">${escapeHtml(options.actionLabel)}</a>`
      : ''

  return `<!doctype html><html><body style="margin:0;background:#06130f;font-family:Inter,Segoe UI,Arial,sans-serif;color:#ecfeff;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#06130f,#082c34 52%,#06130f);padding:32px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid rgba(52,211,153,.22);border-radius:24px;overflow:hidden;background:rgba(8,28,22,.92);box-shadow:0 28px 80px rgba(0,0,0,.35);"><tr><td style="padding:28px 30px;background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(34,211,238,.12));"><div style="display:inline-block;border-radius:999px;background:rgba(52,211,153,.14);color:${accent};padding:7px 12px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${badge}</div><h1 style="margin:18px 0 0;color:#ffffff;font-size:30px;line-height:1.15;font-weight:800;">${headline}</h1><p style="margin:10px 0 0;color:#b7d8d0;font-size:14px;line-height:1.6;">${preheader}</p></td></tr><tr><td style="padding:30px;">${paragraphs}${detailRows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;border:1px solid rgba(52,211,153,.16);border-radius:16px;overflow:hidden;background:rgba(6,19,15,.76);">${detailRows}</table>` : ''}${action}<p style="margin:26px 0 0;color:#8aa39c;font-size:12px;line-height:1.6;">This email was sent for your security. Nova Bank will never ask for your password, PIN, or one-time code by email.</p></td></tr><tr><td style="padding:18px 30px;background:rgba(5,19,16,.9);color:#7fb5aa;font-size:12px;">Nova Bank &bull; Secure digital banking</td></tr></table></td></tr></table></body></html>`
}

async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options: EmailOptions = {}
) {
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASSWORD || ''

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text: body,
    html: buildEmailHtml(subject, body, options)
  })
}
