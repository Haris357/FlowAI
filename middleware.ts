import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract the real client IP, respecting common proxy headers. */
function getIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||          // Cloudflare
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** Allowed origins for CORS / request-origin validation. */
function getAllowedOrigins(): string[] {
  const base = process.env.APP_URL || 'https://flowbooksai.com';
  return [
    base,
    'https://flowbooksai.com',
    'https://www.flowbooksai.com',
    'https://admin.flowbooksai.com',
    'https://status.flowbooksai.com',
    'https://support.flowbooksai.com',
    'https://docs.flowbooksai.com',
    // Vercel preview deployments (any *.vercel.app subdomain for this project)
    // Checked dynamically below.
  ];
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // same-origin / non-browser requests have no Origin header
  const allowed = getAllowedOrigins();
  if (allowed.some(o => origin === o || origin.startsWith(o))) return true;
  // Allow Vercel preview URLs: https://flowbooksai-*.vercel.app
  if (/^https:\/\/flowbooksai(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) return true;
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

/** Known bad user-agent patterns (scanners, exploit tools). */
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /openvas/i,
  /masscan/i,
  /zgrab/i,
  /python-requests\/[01]\./i, // very old python-requests often used in mass scanning
  /go-http-client\/1\./i,     // raw Go HTTP client (common in scanners)
  /\bscrapy\b/i,
  /\bsemrush\b/i,
  /\bahrefs\b/i,
];

/** Paths that should never be served from the outside. */
const BLOCKED_PATHS = [
  /\/\.env/i,
  /\/\.git\//i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/phpmyadmin/i,
  /\/admin\/config/i,
  /\/etc\/passwd/i,
  /\/proc\//i,
  /\.php$/i,
  /\.asp(x)?$/i,
  /\/xmlrpc\.php/i,
];

// ─── CORS preflight helper ───────────────────────────────────────────────────

function handleCORS(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/** Hosts that should never be indexed by search engines. */
function shouldNoindexHost(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname.startsWith('admin.') || hostname.startsWith('admin-')) return true;
  if (hostname.startsWith('status.') || hostname.startsWith('status-')) return true;
  // Any Vercel preview or branch deployment
  if (/\.vercel\.app$/i.test(hostname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const origin = request.headers.get('origin');
  const ua = request.headers.get('user-agent') || '';
  const ip = getIP(request);
  const noindex = shouldNoindexHost(hostname);

  // ── 1. Block known-bad paths (path traversal / CMS probes) ──────────────
  if (BLOCKED_PATHS.some(re => re.test(pathname))) {
    return new NextResponse('Not found', { status: 404 });
  }

  // ── 2. Block known scanner / exploit user-agents ────────────────────────
  if (BLOCKED_UA_PATTERNS.some(re => re.test(ua))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ── 3. CORS: reject API calls from disallowed origins ───────────────────
  //    Only enforce on API routes (browser CORS — not XHR from wrong domain)
  if (pathname.startsWith('/api/')) {
    if (origin && !isAllowedOrigin(origin)) {
      return new NextResponse('Forbidden: origin not allowed', { status: 403 });
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 });
      return handleCORS(request, preflight);
    }
  }

  // ── 4. Status subdomain routing ──────────────────────────────────────────
  const isStatusSubdomain =
    hostname.startsWith('status.') ||
    hostname.startsWith('status-');

  if (isStatusSubdomain) {
    if (pathname.startsWith('/api') || pathname.startsWith('/status')) {
      const res = NextResponse.next();
      if (pathname.startsWith('/api/')) handleCORS(request, res);
      if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = `/status${pathname === '/' ? '' : pathname}`;
    const res = NextResponse.rewrite(url);
    if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // ── 5. Admin subdomain routing ───────────────────────────────────────────
  const isAdminSubdomain =
    hostname.startsWith('admin.') ||
    hostname.startsWith('admin-');

  if (isAdminSubdomain) {
    if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
      const res = NextResponse.next();
      if (pathname.startsWith('/api/')) handleCORS(request, res);
      if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    const res = NextResponse.rewrite(url);
    if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // On main domain redirect /admin/* to admin subdomain (production only)
  if (pathname.startsWith('/admin')) {
    const isLocalhost =
      hostname.includes('localhost') || hostname.includes('127.0.0.1');
    if (!isLocalhost) {
      const adminPath = pathname.replace(/^\/admin/, '') || '/';
      const adminUrl = new URL(adminPath, 'https://admin.flowbooksai.com');
      adminUrl.search = request.nextUrl.search;
      return NextResponse.redirect(adminUrl);
    }
  }

  // ── 6. Support subdomain routing ─────────────────────────────────────────
  const isSupportSubdomain =
    hostname.startsWith('support.') ||
    hostname.startsWith('support-');

  if (isSupportSubdomain) {
    // API calls + pages already under /support pass straight through.
    // /login and /auth/* belong to the main app — redirect there rather than
    // rewriting to /support/login (which doesn't exist).
    if (pathname.startsWith('/api') || pathname.startsWith('/support')) {
      const res = NextResponse.next();
      if (pathname.startsWith('/api/')) handleCORS(request, res);
      return res;
    }
    if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
      const mainApp = process.env.APP_URL || 'https://flowbooksai.com';
      const dest = new URL(pathname, mainApp);
      dest.search = request.nextUrl.search;
      return NextResponse.redirect(dest);
    }
    // Everything else gets rewritten into /support/*
    const url = request.nextUrl.clone();
    url.pathname = `/support${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // On main domain, redirect /support/* to the support subdomain (prod only)
  if (pathname.startsWith('/support')) {
    const isLocalhost =
      hostname.includes('localhost') || hostname.includes('127.0.0.1');
    if (!isLocalhost && !hostname.startsWith('support.')) {
      const supportPath = pathname.replace(/^\/support/, '') || '/';
      const supportUrl = new URL(supportPath, 'https://support.flowbooksai.com');
      supportUrl.search = request.nextUrl.search;
      return NextResponse.redirect(supportUrl);
    }
  }

  // ── 7. Docs subdomain routing ────────────────────────────────────────────
  // Public docs site — no auth required.
  const isDocsSubdomain =
    hostname.startsWith('docs.') ||
    hostname.startsWith('docs-');

  if (isDocsSubdomain) {
    if (pathname.startsWith('/api') || pathname.startsWith('/docs')) {
      const res = NextResponse.next();
      if (pathname.startsWith('/api/')) handleCORS(request, res);
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = `/docs${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // On main domain redirect /docs/* to the docs subdomain (prod only)
  if (pathname.startsWith('/docs')) {
    const isLocalhost =
      hostname.includes('localhost') || hostname.includes('127.0.0.1');
    if (!isLocalhost && !hostname.startsWith('docs.')) {
      const docsPath = pathname.replace(/^\/docs/, '') || '/';
      const docsUrl = new URL(docsPath, 'https://docs.flowbooksai.com');
      docsUrl.search = request.nextUrl.search;
      return NextResponse.redirect(docsUrl);
    }
  }

  // ── 6. Pass through with CORS headers on API routes ─────────────────────
  const res = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    handleCORS(request, res);
    // Prevent API responses from being cached by browsers / CDNs
    res.headers.set('Cache-Control', 'no-store');
  }
  if (noindex) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
