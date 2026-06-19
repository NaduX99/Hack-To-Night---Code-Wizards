import { requireAuth, serviceFailure } from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    return Response.json({ ok: true, user: auth.user })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
