import { ResultSetHeader, RowDataPacket } from 'mysql2'
import {
  asText,
  audit,
  queueEmail,
  readRequestBody,
  requireAuth,
  serviceFailure,
  withTransaction
} from '@/lib/platform-db'

type AccountRow = RowDataPacket & {
  account_number: string
  balance: string
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const fromAccount = asText(body.fromAccount || body.from).trim()
    const toAccount = asText(body.toAccount || body.to).trim()
    const toAccountName = asText(body.toAccountName || body.accountName).trim()
    const bankName = asText(body.bankName || body.bank || 'Nova Bank').trim()
    const purpose = asText(body.purpose || body.description)
      .trim()
      .slice(0, 255)
    const shouldSaveBeneficiary =
      body.saveBeneficiary === undefined ||
      body.saveBeneficiary === true ||
      body.saveBeneficiary === 'true' ||
      body.saveBeneficiary === 'on'
    const amount = Number(asText(body.amount))
    const description = asText(body.description || purpose)
      .trim()
      .slice(0, 500)

    if (!/^\d{6,20}$/.test(fromAccount) || !/^\d{6,20}$/.test(toAccount)) {
      return Response.json(
        {
          ok: false,
          message: 'Valid source and destination accounts are required.'
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: 'Transfer amount must be greater than zero.' },
        { status: 400 }
      )
    }

    if (purpose.length < 3) {
      return Response.json(
        { ok: false, message: 'Transfer purpose is required.' },
        { status: 400 }
      )
    }

    if (fromAccount === toAccount) {
      return Response.json(
        {
          ok: false,
          message: 'Source and destination accounts must be different.'
        },
        { status: 400 }
      )
    }

    const transaction = await withTransaction(async (connection) => {
      const [sourceRows] = await connection.execute<AccountRow[]>(
        `
        SELECT account_number, balance
        FROM accounts
        WHERE account_number = ?
          AND user_id = ?
        FOR UPDATE
        `,
        [fromAccount, auth.user.id]
      )
      const source = sourceRows[0]

      if (!source) {
        throw new TransferError(
          'Source account was not found for this user.',
          404
        )
      }

      if (Number(source.balance) < amount) {
        throw new TransferError('Insufficient balance.', 400)
      }

      const [destinationRows] = await connection.execute<AccountRow[]>(
        `
        SELECT account_number, balance
        FROM accounts
        WHERE account_number = ?
        FOR UPDATE
        `,
        [toAccount]
      )
      const destination = destinationRows[0]

      if (!destination && bankName.toLowerCase() === 'nova bank') {
        throw new TransferError(
          'Destination Nova Bank account was not found.',
          404
        )
      }

      await connection.execute(
        'UPDATE accounts SET balance = balance - ? WHERE account_number = ?',
        [amount, fromAccount]
      )
      if (destination) {
        await connection.execute(
          'UPDATE accounts SET balance = balance + ? WHERE account_number = ?',
          [amount, toAccount]
        )
      }

      const [inserted] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO transactions (from_account, to_account, amount, description, purpose, category, created_by)
        VALUES (?, ?, ?, ?, ?, 'Transfers', ?)
        `,
        [fromAccount, toAccount, amount, description, purpose, auth.user.id]
      )

      await connection.execute(
        `
        UPDATE budgets
        SET spent_amount = spent_amount + ?
        WHERE user_id = ?
          AND LOWER(category) IN ('transfers', 'transfer')
        `,
        [amount, auth.user.id]
      )

      if (shouldSaveBeneficiary && toAccountName) {
        await connection.execute(
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
            toAccount,
            toAccountName,
            bankName || 'Nova Bank',
            toAccountName
          ]
        )
      }

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM transactions WHERE id = ?',
        [inserted.insertId]
      )

      return rows[0]
    })

    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Nova Bank transfer completed',
      `Transfer completed.

From account: ${fromAccount}
To account: ${toAccount}
Beneficiary: ${toAccountName || 'beneficiary'}
Bank: ${bankName || 'External bank'}
Amount: Rs. ${amount.toFixed(2)}
Purpose: ${purpose}
Reference: ${transaction.id}`
    )
    await audit('transfer.create', {
      userId: auth.user.id,
      fromAccount,
      toAccount,
      amount
    })

    return Response.json({
      ok: true,
      message: 'Transfer accepted.',
      transaction
    })
  } catch (reason) {
    if (reason instanceof TransferError) {
      return Response.json(
        { ok: false, message: reason.message },
        { status: reason.status }
      )
    }

    return serviceFailure(reason)
  }
}

class TransferError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}
