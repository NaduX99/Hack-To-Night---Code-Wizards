export async function GET() {
  return Response.json({
    ok: true,
    endpoint: '/api/auth/logout',
    method: 'POST',
    note: 'Send POST to clear the current secure session cookie.'
  })
}

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        'set-cookie': 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
      }
    }
  )
}
