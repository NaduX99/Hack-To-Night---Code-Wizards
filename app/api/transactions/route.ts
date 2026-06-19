import { asText, query, requireAuth, serviceFailure } from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const { searchParams } = new URL(request.url)
    const account = asText(searchParams.get('account')).trim()

    if (!/^\d{6,20}$/.test(account)) {
      return Response.json(
        { ok: false, message: 'Valid account number is required.' },
        { status: 400 }
      )
    }

    const result = await query(
      `
      SELECT *
      FROM transactions
      WHERE (from_account = ? OR to_account = ?)
        AND (
          ? = 'admin'
          OR EXISTS (
            SELECT 1 FROM accounts
            WHERE account_number = ?
              AND user_id = ?
          )
        )
      ORDER BY created_at DESC
      `,
      [account, account, auth.user.role, account, auth.user.id]
    )

    return Response.json({
      ok: true,
      account,
      transactions: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
