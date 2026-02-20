import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/admin', '/salon', '/profile', '/appointments'];
const authRoutes = ['/admin/signup', '/salon/login', '/welcome', '/admin/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route) && !authRoutes.some(authRoute => pathname.startsWith(authRoute))
  );

  if (isProtectedRoute) {
    // In a real application, you would check for authentication tokens here
    // For now, we'll just allow all requests to pass through
    // You can implement proper authentication logic here later

    // Example of how you might check for authentication:
    // const token = request.cookies.get('auth-token');
    // if (!token) {
    //   return NextResponse.redirect(new URL('/welcome', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
