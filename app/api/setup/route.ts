import {
  ensureDatabase,
  pool,
  requireAdmin,
  serviceFailure
} from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.response) return auth.response

    await ensureDatabase()
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `)

    return Response.json({
      ok: true,
      message: 'Database initialized.',
      tables: tables.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
