import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware is a pass-through.
 * Auth guards are handled client-side via useAuth hook in layout components.
 * Firebase Auth state cannot be accessed server-side in middleware.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
