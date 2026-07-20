import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'evoq_core_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass authentication checks for static assets (images, logos)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Define public vs protected routes
  const isPublicRoute = pathname === '/login' || 
                        pathname === '/forgot-password' || 
                        pathname === '/reset-password' ||
                        pathname === '/attendance-portal' ||
                        pathname.startsWith('/onboard/');

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. If trying to access a protected route without a token
  if (!isPublicRoute && !token) {
    const url = new URL('/login', request.url);
    // Remember where they wanted to go
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If token exists, inspect user's role and restrict access
  if (token) {
    try {
      // Token structure is: base64Data.signature
      const base64Data = token.split('.')[0];
      if (!base64Data) {
        throw new Error('Invalid token format');
      }

      // Decode base64 in edge-compatible way using atob
      const jsonString = atob(base64Data);
      const user = JSON.parse(jsonString);

      // Check if user account is active
      if (user.status === 'INACTIVE') {
        const response = NextResponse.redirect(new URL('/login?error=inactive', request.url));
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }

      // If user is already logged in and tries to open login/auth pages, redirect to dashboard
      // (Except for the attendance portal which they need to see the success screen for)
      if (isPublicRoute && !pathname.startsWith('/onboard/') && pathname !== '/attendance-portal') {
        return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
      }

      // Route-based authorization check
      if (pathname.startsWith('/hr') && pathname !== '/hr/leaderboard' && user.role !== 'HR') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (pathname.startsWith('/admin') && user.role !== 'ADMIN' && user.role !== 'HR') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (pathname.startsWith('/frontdesk') && user.role !== 'FRONT_DESK' && user.role !== 'HR') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

    } catch (error) {
      console.error('Middleware token parsing error:', error);
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'HR':
      return '/hr/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'FRONT_DESK':
      return '/frontdesk/dashboard';
    default:
      return '/unauthorized';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (static document/photo uploads)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
