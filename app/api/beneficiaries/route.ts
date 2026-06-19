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
      SELECT id, account_number, account_name, bank_name, nickname, created_at
      FROM beneficiaries
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [auth.user.id]
    )

    return Response.json({ ok: true, beneficiaries: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const accountNumber = asText(body.accountNumber || body.toAccount).trim()
    const accountName = asText(body.accountName || body.toAccountName).trim()
    const bankName = asText(body.bankName || body.bank || 'Nova Bank').trim()
    const nickname = asText(body.nickname || accountName).trim()

    if (!/^\d{6,20}$/.test(accountNumber) || accountName.length < 2) {
      return Response.json(
        {
          ok: false,
          message: 'Valid beneficiary account number and name are required.'
        },
        { status: 400 }
      )
    }

    await query(
      `
      INSERT INTO beneficiaries (user_id, account_number, account_name, bank_name, nickname)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        account_name = VALUES(account_name),
        bank_name = VALUES(bank_name),
        nickname = VALUES(nickname)
      `,
      [
        auth.user.id,
        accountNumber,
        accountName,
        bankName || 'Nova Bank',
        nickname
      ]
    )

    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Nova Bank beneficiary saved',
      `Beneficiary ${accountName} (${accountNumber}) was saved to your Nova Bank profile.`
    )
    await audit('beneficiary.save', {
      userId: auth.user.id,
      accountNumber,
      bankName
    })

    return Response.json({ ok: true, message: 'Beneficiary saved.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { ok: false, message: 'Valid beneficiary ID is required.' },
        { status: 400 }
      )
    }

    await query('DELETE FROM beneficiaries WHERE id = ? AND user_id = ?', [
      id,
      auth.user.id
    ])
    await audit('beneficiary.delete', { userId: auth.user.id, id })

    return Response.json({ ok: true, message: 'Beneficiary deleted.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
