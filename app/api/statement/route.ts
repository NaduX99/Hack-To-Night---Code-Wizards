import {
  asText,
  audit,
  query,
  queueEmail,
  requireAuth,
  serviceFailure
} from '@/lib/platform-db'

type StatementTransaction = {
  id: number
  from_account: string
  to_account: string
  amount: string
  description: string | null
  status: string
  created_at: string
}

type StatementBill = {
  id: number
  biller_name: string
  bill_id: string
  amount: string
  remarks: string | null
  status: string
  created_at: string
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const { searchParams } = new URL(request.url)
    const accountNumber = asText(searchParams.get('account')).trim()

    if (!/^\d{6,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Valid account number is required.' },
        { status: 400 }
      )
    }

    const accountResult = await query(
      `
      SELECT a.id, a.user_id, a.account_number, a.account_name, a.branch,
             a.balance, u.full_name, u.email
      FROM accounts a
      JOIN users u ON u.id = a.user_id
      WHERE a.account_number = ?
        AND (? = 'admin' OR a.user_id = ?)
      LIMIT 1
      `,
      [accountNumber, auth.user.role, auth.user.id]
    )
    const account = accountResult.rows[0]

    if (!account) {
      return Response.json(
        { ok: false, message: 'Account was not found for this user.' },
        { status: 404 }
      )
    }

    const transactionResult = await query(
      `
      SELECT id, from_account, to_account, amount, description, status, created_at
      FROM transactions
      WHERE from_account = ? OR to_account = ?
      ORDER BY created_at ASC, id ASC
      `,
      [accountNumber, accountNumber]
    )
    const transactions = transactionResult.rows as StatementTransaction[]
    const billResult = await query(
      `
      SELECT id, biller_name, bill_id, amount, remarks, status, created_at
      FROM bill_payments
      WHERE account_number = ?
      ORDER BY created_at ASC, id ASC
      `,
      [accountNumber]
    )
    const bills = billResult.rows as StatementBill[]
    const closingBalance = Number(account.balance)
    const totalCredits = transactions
      .filter((transaction) => transaction.to_account === accountNumber)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const transferDebits = transactions
      .filter((transaction) => transaction.from_account === accountNumber)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const billDebits = bills.reduce((sum, bill) => sum + Number(bill.amount), 0)
    const totalDebits = transferDebits + billDebits
    const openingBalance = closingBalance - totalCredits + totalDebits

    let runningBalance = openingBalance
    const rows = [
      ...transactions.map((transaction) => {
        const amount = Number(transaction.amount)
        return {
          id: transaction.id,
          date: transaction.created_at,
          description: transaction.description || 'Transfer',
          referenceId: `TXN-${transaction.id}`,
          debit: transaction.from_account === accountNumber ? amount : 0,
          credit: transaction.to_account === accountNumber ? amount : 0,
          status: transaction.status
        }
      }),
      ...bills.map((bill) => ({
        id: bill.id,
        date: bill.created_at,
        description: `${bill.biller_name} bill ${bill.bill_id}`,
        referenceId: `BILL-${bill.id}`,
        debit: Number(bill.amount),
        credit: 0,
        status: bill.status
      }))
    ]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((row) => {
        runningBalance = runningBalance - row.debit + row.credit
        return { ...row, balance: runningBalance }
      })

    await queueEmail(
      auth.user.id,
      auth.user.email || '',
      'Nova Bank e-statement generated',
      `Your e-statement was generated successfully.

Account: ${accountNumber}
Opening balance: Rs. ${openingBalance.toFixed(2)}
Total credits: Rs. ${totalCredits.toFixed(2)}
Total debits: Rs. ${totalDebits.toFixed(2)}
Closing balance: Rs. ${closingBalance.toFixed(2)}
Transactions: ${rows.length}`,
      {
        badge: 'E-statement ready',
        headline: 'Your account statement is ready',
        preheader: `Statement summary for account ${accountNumber}.`,
        tone: 'notice',
        actionLabel: 'Open e-statement',
        actionUrl: '/e-statement'
      }
    )
    await audit('statement.generate', { userId: auth.user.id, accountNumber })

    return Response.json({
      ok: true,
      statement: {
        accountHolder: account.full_name,
        accountName: account.account_name,
        accountNumber: account.account_number,
        branch: account.branch,
        period: {
          from: rows[0]?.date || null,
          to: rows.at(-1)?.date || null
        },
        summary: {
          openingBalance,
          totalCredits,
          totalDebits,
          closingBalance
        },
        transactions: rows
      }
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
