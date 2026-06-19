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
    const accountNumber = asText(body.accountNumber).trim()
    const billerId = asText(body.billerId).trim()
    const billerName = asText(body.billerName).trim()
    const billId = asText(body.billId).trim()
    const amount = Number(asText(body.amount || body.dueAmount))
    const remarks = asText(body.remarks).trim().slice(0, 500)
    const category = asText(body.category || billerName || 'Bills')
      .trim()
      .slice(0, 100)
    const purpose = asText(body.purpose || remarks || `${billerName} bill`)
      .trim()
      .slice(0, 255)

    if (
      !/^\d{6,20}$/.test(accountNumber) ||
      !billerId ||
      !billerName ||
      !/^[a-zA-Z0-9-]{3,50}$/.test(billId)
    ) {
      return Response.json(
        {
          ok: false,
          message:
            'Valid account, biller, and bill ID are required. Bill ID must be 3-50 letters/numbers.'
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: 'Payment amount must be greater than zero.' },
        { status: 400 }
      )
    }

    if (purpose.length < 3) {
      return Response.json(
        { ok: false, message: 'Payment purpose is required.' },
        { status: 400 }
      )
    }

    const result = await withTransaction(async (connection) => {
      const [accounts] = await connection.execute<AccountRow[]>(
        `
        SELECT account_number, balance
        FROM accounts
        WHERE account_number = ?
          AND user_id = ?
        FOR UPDATE
        `,
        [accountNumber, auth.user.id]
      )
      const account = accounts[0]

      if (!account) {
        throw new BillPaymentError('Account was not found for this user.', 404)
      }

      if (Number(account.balance) < amount) {
        throw new BillPaymentError('Insufficient balance.', 400)
      }

      await connection.execute(
        'UPDATE accounts SET balance = balance - ? WHERE account_number = ?',
        [amount, accountNumber]
      )

      const [inserted] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO bill_payments (user_id, account_number, biller_id, biller_name, bill_id, amount, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          auth.user.id,
          accountNumber,
          billerId,
          billerName,
          billId,
          amount,
          remarks
        ]
      )

      await connection.execute(
        `
        INSERT INTO transactions (from_account, to_account, amount, description, purpose, category, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          accountNumber,
          billerId,
          amount,
          remarks || `${billerName} bill ${billId}`,
          purpose,
          category || 'Bills',
          auth.user.id
        ]
      )

      await connection.execute(
        `
        UPDATE budgets
        SET spent_amount = spent_amount + ?
        WHERE user_id = ?
          AND (
            LOWER(category) = LOWER(?)
            OR LOWER(category) = LOWER(?)
            OR LOWER(category) IN ('bills', 'bill payments')
          )
        `,
        [amount, auth.user.id, category || 'Bills', billerName]
      )

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM bill_payments WHERE id = ?',
        [inserted.insertId]
      )

      return {
        payment: rows[0],
        availableBalance: Number(account.balance) - amount
      }
    })

    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Nova Bank bill payment completed',
      `Bill payment completed.

Account: ${accountNumber}
Biller: ${billerName}
Bill ID: ${billId}
Amount: Rs. ${amount.toFixed(2)}
Category: ${category || 'Bills'}
Purpose: ${purpose}
Available balance: Rs. ${result.availableBalance.toFixed(2)}
Reference: ${result.payment.id}`
    )
    await audit('bill_payment.create', {
      userId: auth.user.id,
      accountNumber,
      billerId,
      amount
    })

    return Response.json({
      ok: true,
      message: 'Bill payment completed.',
      payment: result.payment,
      availableBalance: result.availableBalance
    })
  } catch (reason) {
    if (reason instanceof BillPaymentError) {
      return Response.json(
        { ok: false, message: reason.message },
        { status: reason.status }
      )
    }

    return serviceFailure(reason)
  }
}

class BillPaymentError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}
