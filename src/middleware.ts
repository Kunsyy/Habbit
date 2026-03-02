import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/habits', '/settings', '/analytics'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = process.env.AUTH_COOKIE_NAME || 'session';
  const sessionCookie = request.cookies.get(cookieName);

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r));

  if (isProtected && !sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && sessionCookie?.value) {
    return NextResponse.redirect(new URL('/habits', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
};
