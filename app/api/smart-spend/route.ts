import {
  asText,
  query,
  readRequestBody,
  requireAuth,
  serviceFailure
} from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const accounts = await query(
      'SELECT account_number, account_name, balance FROM accounts WHERE user_id = ? ORDER BY id',
      [auth.user.id]
    )
    const transfers = await query(
      `
      SELECT amount, description, created_at, from_account
      FROM transactions
      WHERE created_by = ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [auth.user.id]
    )
    const bills = await query(
      `
      SELECT amount, biller_name, created_at
      FROM bill_payments
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [auth.user.id]
    )
    const budgets = await query(
      `
      SELECT id, category, target_amount, spent_amount, period
      FROM budgets
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [auth.user.id]
    )

    const totalBalance = accounts.rows.reduce(
      (sum, account) => sum + Number(account.balance),
      0
    )
    const transferSpend = transfers.rows.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    )
    const billSpend = bills.rows.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0
    )

    return Response.json({
      ok: true,
      smartSpend: {
        totalBalance,
        totalSpend: transferSpend + billSpend,
        transferSpend,
        billSpend,
        accounts: accounts.rows,
        recentTransfers: transfers.rows,
        recentBills: bills.rows,
        budgets: budgets.rows,
        currencyRates: await getCurrencyRates(),
        insight:
          billSpend > transferSpend
            ? 'Bills are your largest spending category.'
            : 'Transfers are your largest spending category.'
      }
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
    const category = asText(body.category).trim()
    const targetAmount = Number(asText(body.targetAmount))
    const period = asText(body.period || 'monthly').trim()

    if (!category || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      return Response.json(
        {
          ok: false,
          message: 'Valid budget category and target are required.'
        },
        { status: 400 }
      )
    }

    await query(
      `
      INSERT INTO budgets (user_id, category, target_amount, period)
      VALUES (?, ?, ?, ?)
      `,
      [auth.user.id, category, targetAmount, period]
    )

    return Response.json({
      ok: true,
      message: 'Budget target created.'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const id = Number(asText(body.id))
    const category = asText(body.category).trim()
    const targetAmount = Number(asText(body.targetAmount))
    const increaseBy = Number(asText(body.increaseBy || 0))
    const period = asText(body.period || 'monthly').trim()

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { ok: false, message: 'Valid budget ID is required.' },
        { status: 400 }
      )
    }

    if (Number.isFinite(increaseBy) && increaseBy > 0) {
      await query(
        `
        UPDATE budgets
        SET target_amount = target_amount + ?
        WHERE id = ? AND user_id = ?
        `,
        [increaseBy, id, auth.user.id]
      )

      return Response.json({ ok: true, message: 'Budget target increased.' })
    }

    if (!category || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      return Response.json(
        {
          ok: false,
          message: 'Valid category and target amount are required.'
        },
        { status: 400 }
      )
    }

    await query(
      `
      UPDATE budgets
      SET category = ?, target_amount = ?, period = ?
      WHERE id = ? AND user_id = ?
      `,
      [category, targetAmount, period, id, auth.user.id]
    )

    return Response.json({ ok: true, message: 'Budget target updated.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

async function getCurrencyRates() {
  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=LKR,EUR,GBP,INR',
      { next: { revalidate: 60 * 60 * 12 } }
    )
    const payload = await response.json()

    return {
      base: payload.base || 'USD',
      date: payload.date || null,
      rates: payload.rates || {}
    }
  } catch {
    return {
      base: 'USD',
      date: null,
      rates: {
        LKR: 300,
        EUR: 0.92,
        GBP: 0.78,
        INR: 83
      }
    }
  }
}
