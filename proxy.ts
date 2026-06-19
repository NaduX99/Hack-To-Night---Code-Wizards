import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const protectedPages = [
  '/dashboard',
  '/bank-accounts',
  '/bank-transfer',
  '/pay-bills',
  '/smart-spend',
  '/savings-goals',
  '/e-statement',
  '/profile',
  '/settings',
  '/notifications'
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get('session')?.value)

  if (protectedPages.some((page) => pathname.startsWith(page)) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bank-accounts/:path*',
    '/bank-transfer/:path*',
    '/pay-bills/:path*',
    '/smart-spend/:path*',
    '/savings-goals/:path*',
    '/e-statement/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notifications/:path*'
  ]
}
