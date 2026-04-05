import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register']

// Routes that require authentication
const protectedRoutes = ['/', '/clients', '/alarms', '/finances', '/trash']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie - just check if it exists, don't verify
  const token = request.cookies.get('auth-token')?.value
  
  // Check if user has a token (actual verification happens in API/client)
  const hasToken = !!token

  // If trying to access protected route without token
  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (!hasToken) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If trying to access login/register while having a token
  if (publicRoutes.includes(pathname)) {
    if (hasToken) {
      const dashboardUrl = new URL('/', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg|images).*)',
  ],
}
