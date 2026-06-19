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

    const { searchParams } = new URL(request.url)
    const requestedUserId = Number(
      asText(searchParams.get('userId') || auth.user.id)
    )
    const userId = auth.user.role === 'admin' ? requestedUserId : auth.user.id

    const result = await query(
      `
      SELECT a.id, a.user_id, a.account_number, a.account_name, a.branch,
             a.balance, u.username, u.full_name, u.email
      FROM accounts a
      JOIN users u ON u.id = a.user_id
      WHERE a.user_id = ?
      ORDER BY a.id
      `,
      [userId]
    )

    return Response.json({
      ok: true,
      note: 'Account list prepared.',
      accounts: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const accountNumber = asText(body.accountNumber).trim()
    const accountName = asText(body.accountName || body.nickname).trim()
    const branch = asText(body.branch || 'Main Branch').trim()

    if (!/^\d{6,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Enter a valid account number.' },
        { status: 400 }
      )
    }

    if (accountName.length < 2) {
      return Response.json(
        { ok: false, message: 'Account name is required.' },
        { status: 400 }
      )
    }

    const existing = await query(
      'SELECT id FROM accounts WHERE account_number = ? LIMIT 1',
      [accountNumber]
    )

    if (existing.rows[0]) {
      return Response.json(
        { ok: false, message: 'This account number is already registered.' },
        { status: 409 }
      )
    }

    await query(
      `
      INSERT INTO accounts (user_id, account_number, account_name, branch, balance, pin)
      VALUES (?, ?, ?, ?, 100000.00, '0000')
      `,
      [auth.user.id, accountNumber, accountName, branch]
    )
    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'New bank account added',
      `Your new bank account ${accountNumber} was added successfully.`
    )
    await audit('account.create', { userId: auth.user.id, accountNumber })

    const created = await query(
      `
      SELECT a.id, a.user_id, a.account_number, a.account_name, a.branch,
             a.balance, u.username, u.full_name, u.email
      FROM accounts a
      JOIN users u ON u.id = a.user_id
      WHERE a.account_number = ?
      LIMIT 1
      `,
      [accountNumber]
    )

    return Response.json(
      {
        ok: true,
        message: 'Bank account created successfully.',
        account: created.rows[0]
      },
      { status: 201 }
    )
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const accountNumber = asText(body.accountNumber).trim()
    const accountName = asText(body.accountName).trim()
    const branch = asText(body.branch || 'Main Branch').trim()

    if (!/^\d{6,20}$/.test(accountNumber) || accountName.length < 2) {
      return Response.json(
        { ok: false, message: 'Valid account number and name are required.' },
        { status: 400 }
      )
    }

    const result = await query(
      `
      UPDATE accounts
      SET account_name = ?, branch = ?
      WHERE account_number = ?
        AND user_id = ?
      `,
      [accountName, branch, accountNumber, auth.user.id]
    )

    const updated = await query(
      `
      SELECT id, user_id, account_number, account_name, branch, balance
      FROM accounts
      WHERE account_number = ?
        AND user_id = ?
      LIMIT 1
      `,
      [accountNumber, auth.user.id]
    )

    if (!updated.rows[0]) {
      return Response.json(
        { ok: false, message: 'Account was not found for this user.' },
        { status: 404 }
      )
    }

    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Bank account updated',
      `Your bank account ${accountNumber} was updated successfully.`
    )
    await audit('account.update', {
      userId: auth.user.id,
      accountNumber,
      result
    })

    return Response.json({
      ok: true,
      message: 'Bank account updated successfully.',
      account: updated.rows[0]
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const { searchParams } = new URL(request.url)
    const accountNumber = asText(searchParams.get('accountNumber')).trim()

    if (!/^\d{6,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Valid account number is required.' },
        { status: 400 }
      )
    }

    const existing = await query(
      `
      SELECT id, balance
      FROM accounts
      WHERE account_number = ?
        AND user_id = ?
      LIMIT 1
      `,
      [accountNumber, auth.user.id]
    )

    if (!existing.rows[0]) {
      return Response.json(
        { ok: false, message: 'Account was not found for this user.' },
        { status: 404 }
      )
    }

    if (Number(existing.rows[0].balance) !== 0) {
      return Response.json(
        { ok: false, message: 'Only zero-balance accounts can be deleted.' },
        { status: 400 }
      )
    }

    await query(
      `
      DELETE FROM accounts
      WHERE account_number = ?
        AND user_id = ?
      `,
      [accountNumber, auth.user.id]
    )
    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Bank account deleted',
      `Your bank account ${accountNumber} was deleted successfully.`
    )
    await audit('account.delete', { userId: auth.user.id, accountNumber })

    return Response.json({
      ok: true,
      message: 'Bank account deleted successfully.'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
