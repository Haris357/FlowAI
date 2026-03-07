import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Handle admin subdomain: admin.flowbooksai.com → /admin routes
  const isAdminSubdomain =
    hostname.startsWith('admin.') ||
    hostname.startsWith('admin-'); // Vercel preview: admin-flowbooksai.vercel.app

  if (isAdminSubdomain) {
    // API routes and /admin paths pass through as-is
    if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    // Rewrite root and all other paths to /admin/*
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // On main domain, redirect /admin/* to admin subdomain
  if (pathname.startsWith('/admin')) {
    const adminPath = pathname.replace(/^\/admin/, '') || '/';
    const adminUrl = new URL(adminPath, `https://admin.flowbooksai.com`);
    adminUrl.search = request.nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
