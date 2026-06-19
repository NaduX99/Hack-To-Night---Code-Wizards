import { ResultSetHeader } from 'mysql2'
import {
  asText,
  audit,
  createSessionCookie,
  hashPassword,
  queueEmail,
  readRequestBody,
  serviceFailure,
  withTransaction
} from '@/lib/platform-db'

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request)
    const accountNumber = asText(body.accountNumber).trim()
    const fullName = asText(body.accountName || body.fullName).trim()
    const branch = asText(body.branch || 'Main Branch').trim()
    const nic = asText(body.nic).trim().toUpperCase()
    const email = asText(body.email).trim().toLowerCase()
    const password = asText(body.password)
    const confirmPassword = asText(body.confirmPassword)

    if (!/^\d{6,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Enter a valid account number.' },
        { status: 400 }
      )
    }

    if (fullName.length < 2) {
      return Response.json(
        { ok: false, message: 'Account name is required.' },
        { status: 400 }
      )
    }

    if (!/^(\d{9}[VX]|\d{12})$/.test(nic)) {
      return Response.json(
        {
          ok: false,
          message: 'NIC is required. Use 12 digits or old 9 digits + V/X.'
        },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { ok: false, message: 'Enter a valid email address.' },
        { status: 400 }
      )
    }

    if (password.length < 6 || password !== confirmPassword) {
      return Response.json(
        {
          ok: false,
          message: 'Passwords must match and be at least 6 characters.'
        },
        { status: 400 }
      )
    }
    const user = await withTransaction(async (connection) => {
      const usernameBase =
        fullName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user'
      let username = usernameBase

      const [existingAccounts] = await connection.execute(
        'SELECT id FROM accounts WHERE account_number = ? LIMIT 1',
        [accountNumber]
      )
      if (Array.isArray(existingAccounts) && existingAccounts[0]) {
        throw new SignupError('This account number is already registered.', 409)
      }

      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
        [email, username]
      )
      if (Array.isArray(existingUsers) && existingUsers[0]) {
        const [sameEmail] = await connection.execute(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [email]
        )

        if (Array.isArray(sameEmail) && sameEmail[0]) {
          throw new SignupError('This email is already registered.', 409)
        }

        username = `${usernameBase}${accountNumber.slice(-4)}`
      }

      const [insertedUser] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO users (username, password, role, full_name, nic, email)
        VALUES (?, ?, 'customer', ?, ?, ?)
        `,
        [username, hashPassword(password), fullName, nic, email]
      )

      await connection.execute(
        `
        INSERT INTO accounts (user_id, account_number, account_name, branch, balance, pin)
        VALUES (?, ?, ?, ?, 100000.00, '0000')
        `,
        [insertedUser.insertId, accountNumber, `${fullName} Savings`, branch]
      )

      return {
        id: insertedUser.insertId,
        username,
        role: 'customer' as const,
        full_name: fullName,
        email
      }
    })

    const headers = new Headers()
    headers.append('set-cookie', createSessionCookie(user))
    await queueEmail(
      user.id,
      user.email,
      'Nova Bank account created',
      `Welcome ${user.full_name}. Your Nova Bank profile and bank account ${accountNumber} were created successfully with Rs. 100,000.00 test balance.`
    )
    await audit('user.signup', { userId: user.id, accountNumber })

    return Response.json(
      {
        ok: true,
        message: 'Account created.',
        user
      },
      { headers, status: 201 }
    )
  } catch (reason) {
    if (reason instanceof SignupError) {
      return Response.json(
        { ok: false, message: reason.message },
        { status: reason.status }
      )
    }

    return serviceFailure(reason)
  }
}

class SignupError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}
