import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

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
    // Quick Firestore connectivity check
    const db = getFirestore();
    await db.collection('__health__').doc('ping').set(
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
