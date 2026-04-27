import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

// Health checks must always run live — never let Next try to prerender at build.
export const dynamic = 'force-dynamic';

initAdmin();

/**
 * GET /api/health
 * Lightweight health endpoint used by:
 * - The status-page monitoring cron (web-app / api check)
 * - Uptime monitoring services
 * - Load balancers
 */
export async function GET() {
  try {
    // Quick Firestore connectivity check.
    // Note: Firestore reserves any collection id matching __.*__ — single underscore is fine.
    const db = getFirestore();
    await db.collection('_health').doc('ping').set(
      { ts: Date.now(), source: 'health-endpoint' },
      { merge: true },
    );

    return NextResponse.json(
      {
        status:    'ok',
        timestamp: new Date().toISOString(),
        version:   process.env.npm_package_version ?? '1.0.0',
      },
      {
        status:  200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    console.error('[/api/health] Firestore check failed:', error);
    return NextResponse.json(
      { status: 'degraded', error: 'Database connectivity issue' },
      { status: 503 },
    );
  }
}
