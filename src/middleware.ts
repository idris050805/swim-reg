import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  const { pathname } = req.nextUrl

  // Public routes - no auth needed
  const publicPaths = ['/login', '/register']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (isPublic) {
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const session = await verifyToken(token)
      if (session) {
        if (session.role === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
        if (session.role === 'referee') return NextResponse.redirect(new URL('/referee', req.url))
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const session = await verifyToken(token)
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('auth-token')
    return res
  }

  if (pathname.startsWith('/admin') && session.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url))
  if (pathname.startsWith('/dashboard') && session.role === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
  if (pathname.startsWith('/dashboard') && session.role === 'referee') return NextResponse.redirect(new URL('/referee', req.url))
  if (pathname.startsWith('/referee') && session.role !== 'referee' && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
}
