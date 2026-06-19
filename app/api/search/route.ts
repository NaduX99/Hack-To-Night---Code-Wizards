import { asText, query, requireAdmin, serviceFailure } from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const q = `%${asText(searchParams.get('q')).trim()}%`

    const result = await query(
      `
      SELECT 'user' AS type, CAST(id AS CHAR) AS id, username AS label, email AS detail FROM users
      WHERE username LIKE ? OR full_name LIKE ?
      UNION ALL
      SELECT 'account' AS type, CAST(id AS CHAR) AS id, account_number AS label, account_name AS detail FROM accounts
      WHERE account_number LIKE ? OR account_name LIKE ?
      UNION ALL
      SELECT 'transaction' AS type, CAST(id AS CHAR) AS id, CONCAT(from_account, ' -> ', to_account) AS label, description AS detail FROM transactions
      WHERE description LIKE ?
      LIMIT 25
      `,
      [q, q, q, q, q]
    )

    return Response.json({
      ok: true,
      query: asText(searchParams.get('q')).trim(),
      results: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
