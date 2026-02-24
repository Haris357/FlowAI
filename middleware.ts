import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Currently a pass-through — future enhancements:
  // - Check Firebase session cookies for protected routes
  // - Rate limiting
  // - Geo-blocking
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
