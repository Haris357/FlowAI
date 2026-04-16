/**
 * Automatic Status Page Monitor
 *
 * Runs every 5 minutes via Vercel Cron.
 * Checks every external service used by FlowBooks AI, then:
 *  - Auto-creates incidents when services go down
 *  - Auto-resolves incidents when services recover
 *  - Updates component statuses in real time
 *  - Seeds default components on first run
 *
 * Services monitored:
 *  firestore        — Firebase Firestore read/write
 *  firebase-auth    — Firebase Authentication
 *  firebase-storage — Firebase Cloud Storage
 *  openai           — OpenAI API (models list, no inference cost)
 *  lemonsqueezy     — Lemon Squeezy payments API
 *  resend           — Resend email API
 *  frankfurter      — Frankfurter exchange rate API
 *  web-app          — FlowBooks AI web app + Vercel CDN (self-check)
 */

import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import {
  DEFAULT_COMPONENT_GROUPS,
  CHECK_METADATA,
  type StatusComponent,
  type ComponentStatus,
} from '@/lib/status-page';

initAdmin();

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  healthy: boolean;
  latencyMs: number;
  error?: string;
  /** 'config' = API key invalid (our fault, not service down), 'service' = service is down */
  errorType?: 'config' | 'service';
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms = 9000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}

// ── Individual health checks ──────────────────────────────────────────────────

async function checkFirestore(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const db = getFirestore();
    await withTimeout(
      db.collection('__health__').doc('cron-ping').set({
        ts:     FieldValue.serverTimestamp(),
        source: 'status-cron',
      }),
    );
    // Also do a read to verify full round-trip
    await withTimeout(db.collection('__health__').doc('cron-ping').get());
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkFirebaseAuth(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const { getAuth } = await import('firebase-admin/auth');
    await withTimeout(getAuth().listUsers(1));
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkFirebaseStorage(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const { getStorage } = await import('firebase-admin/storage');
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucket) {
      return { healthy: false, latencyMs: 0, error: 'Storage bucket env var not set', errorType: 'config' };
    }
    const storageBucket = getStorage().bucket(bucket);
    await withTimeout(storageBucket.getMetadata());
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkOpenAI(): Promise<CheckResult> {
  const t0 = Date.now();
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { healthy: false, latencyMs: 0, error: 'OPENAI_API_KEY not set', errorType: 'config' };
  }
  try {
    const res = await withTimeout(
      fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      }),
    );
    if (res.status === 401) {
      return { healthy: false, latencyMs: Date.now() - t0, error: 'Invalid API key (401)', errorType: 'config' };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkLemonSqueezy(): Promise<CheckResult> {
  const t0 = Date.now();
  const key = process.env.LEMON_SQUEEZY_API_KEY;
  if (!key) {
    return { healthy: false, latencyMs: 0, error: 'LEMON_SQUEEZY_API_KEY not set', errorType: 'config' };
  }
  try {
    const res = await withTimeout(
      fetch('https://api.lemonsqueezy.com/v1/users/me', {
        headers: { Authorization: `Bearer ${key}` },
      }),
    );
    if (res.status === 401) {
      return { healthy: false, latencyMs: Date.now() - t0, error: 'Invalid API key (401)', errorType: 'config' };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkResend(): Promise<CheckResult> {
  const t0 = Date.now();
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { healthy: false, latencyMs: 0, error: 'RESEND_API_KEY not set', errorType: 'config' };
  }
  try {
    const res = await withTimeout(
      fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key}` },
      }),
    );
    if (res.status === 401) {
      return { healthy: false, latencyMs: Date.now() - t0, error: 'Invalid API key (401)', errorType: 'config' };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkFrankfurter(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await withTimeout(fetch('https://api.frankfurter.app/latest?from=USD'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error('Invalid response shape');
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

async function checkWebApp(): Promise<CheckResult> {
  const t0 = Date.now();
  const appUrl = (process.env.APP_URL ?? 'https://flowbooksai.com').replace(/\/$/, '');
  try {
    const res = await withTimeout(fetch(`${appUrl}/api/health`, { cache: 'no-store' }));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { healthy: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: e.message, errorType: 'service' };
  }
}

// ── Registry ─────────────────────────────────────────────────────────────────

const CHECKS: Record<string, () => Promise<CheckResult>> = {
  'firestore':        checkFirestore,
  'firebase-auth':    checkFirebaseAuth,
  'firebase-storage': checkFirebaseStorage,
  'openai':           checkOpenAI,
  'lemonsqueezy':     checkLemonSqueezy,
  'resend':           checkResend,
  'frankfurter':      checkFrankfurter,
  'web-app':          checkWebApp,
};

// ── Latency → degraded threshold ─────────────────────────────────────────────
// If a service responds but is slow, mark it as degraded rather than down.
const DEGRADED_LATENCY_MS: Record<string, number> = {
  'firestore':        3000,
  'firebase-auth':    3000,
  'firebase-storage': 5000,
  'openai':           6000,
  'lemonsqueezy':     4000,
  'resend':           4000,
  'frankfurter':      3000,
  'web-app':          3000,
};

function resultToStatus(checkKey: string, result: CheckResult): ComponentStatus {
  if (!result.healthy) return 'major_outage';
  if (result.latencyMs > (DEGRADED_LATENCY_MS[checkKey] ?? 4000)) return 'degraded';
  return 'operational';
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

function toISO(ts: FirebaseFirestore.Timestamp | null | undefined): string | null {
  return ts ? ts.toDate().toISOString() : null;
}

async function seedComponents(db: FirebaseFirestore.Firestore) {
  console.log('[status-cron] Seeding default components…');
  const batch = db.batch();
  let order = 1;
  for (const grp of DEFAULT_COMPONENT_GROUPS) {
    for (const comp of grp.components) {
      const ref = db.collection('statusComponents').doc();
      batch.set(ref, {
        name:        comp.name,
        description: comp.description,
        group:       grp.group,
        checkKey:    comp.checkKey,
        status:      'operational',
        order:       order++,
        createdAt:   FieldValue.serverTimestamp(),
        updatedAt:   FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
  console.log('[status-cron] Seeded default components.');
}

// ── Auto-incident management ──────────────────────────────────────────────────

async function handleDownTransition(
  db: FirebaseFirestore.Firestore,
  components: StatusComponent[],
  checkKey: string,
  result: CheckResult,
  newStatus: ComponentStatus,
) {
  const meta        = CHECK_METADATA[checkKey];
  const affectedIds = components.filter(c => c.checkKey === checkKey).map(c => c.id);
  if (!affectedIds.length) return;

  // Check for existing open incident for this checkKey
  const existingSnap = await db
    .collection('statusIncidents')
    .where('checkKey', '==', checkKey)
    .where('status', '!=', 'resolved')
    .limit(1)
    .get();

  const errorMsg = result.error ?? 'Service is not responding';
  const impact   = meta?.impact ?? 'major';

  if (existingSnap.empty) {
    // Create a new incident
    const incidentRef = db.collection('statusIncidents').doc();
    const batch       = db.batch();

    batch.set(incidentRef, {
      title:              meta?.incidentTitle ?? `${checkKey} service issue`,
      status:             'investigating',
      impact,
      affectedComponents: affectedIds,
      checkKey,
      auto:               true,
      createdAt:          FieldValue.serverTimestamp(),
      resolvedAt:         null,
      updatedAt:          FieldValue.serverTimestamp(),
    });

    // First update
    const updateRef = incidentRef.collection('updates').doc();
    batch.set(updateRef, {
      status:    'investigating',
      message:   `We have detected an issue with ${meta?.label ?? checkKey}. ${errorMsg}. Our monitoring system has been alerted and we are investigating.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update component statuses
    for (const id of affectedIds) {
      batch.update(db.collection('statusComponents').doc(id), {
        status:    newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`[status-cron] Created incident for ${checkKey}: "${meta?.incidentTitle}"`);
  } else {
    // Incident already exists — only add an update every 30 min to avoid spam
    const incident     = existingSnap.docs[0];
    const incidentData = incident.data();
    const updatedAt    = toISO(incidentData.updatedAt);
    const msSinceUpdate = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;

    if (msSinceUpdate >= 30 * 60 * 1000) {
      const batch = db.batch();
      batch.update(incident.ref, { updatedAt: FieldValue.serverTimestamp() });
      batch.set(incident.ref.collection('updates').doc(), {
        status:    'investigating',
        message:   `${meta?.label ?? checkKey} is still experiencing issues. ${errorMsg}. We continue to investigate.`,
        createdAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      console.log(`[status-cron] Updated ongoing incident for ${checkKey}`);
    }

    // Always keep component statuses in sync
    const compBatch = db.batch();
    for (const id of affectedIds) {
      compBatch.update(db.collection('statusComponents').doc(id), {
        status:    newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await compBatch.commit();
  }
}

async function handleRecoveryTransition(
  db: FirebaseFirestore.Firestore,
  components: StatusComponent[],
  checkKey: string,
  result: CheckResult,
) {
  const meta        = CHECK_METADATA[checkKey];
  const affectedIds = components.filter(c => c.checkKey === checkKey).map(c => c.id);
  if (!affectedIds.length) return;

  // Resolve any open incidents for this checkKey
  const openSnap = await db
    .collection('statusIncidents')
    .where('checkKey', '==', checkKey)
    .where('status', '!=', 'resolved')
    .get();

  const batch = db.batch();

  for (const incDoc of openSnap.docs) {
    batch.update(incDoc.ref, {
      status:     'resolved',
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt:  FieldValue.serverTimestamp(),
    });
    const updateRef = incDoc.ref.collection('updates').doc();
    batch.set(updateRef, {
      status:    'resolved',
      message:   meta?.recoveryMessage ?? `${checkKey} has recovered and is operating normally. Latency: ${result.latencyMs}ms.`,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // Restore component statuses to operational
  for (const id of affectedIds) {
    batch.update(db.collection('statusComponents').doc(id), {
      status:    'operational',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  if (!openSnap.empty) {
    console.log(`[status-cron] Resolved incident for ${checkKey} (${openSnap.size} incident(s))`);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Verify this is coming from Vercel Cron or an authorized source
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const cronStart = Date.now();
  console.log('[status-cron] Starting health checks…');

  try {
    const db = getFirestore();

    // ── 1. Ensure components are seeded ──────────────────────────────────────
    const compSnap = await db.collection('statusComponents').limit(1).get();
    if (compSnap.empty) {
      await seedComponents(db);
    }

    // ── 2. Load all components ────────────────────────────────────────────────
    const allCompSnap = await db.collection('statusComponents').get();
    const components: StatusComponent[] = allCompSnap.docs.map(d => {
      const data = d.data();
      return {
        id:             d.id,
        name:           data.name,
        description:    data.description ?? '',
        group:          data.group,
        status:         data.status,
        order:          data.order,
        checkKey:       data.checkKey,
        lastCheckedAt:  toISO(data.lastCheckedAt) ?? undefined,
        createdAt:      toISO(data.createdAt) ?? new Date().toISOString(),
        updatedAt:      toISO(data.updatedAt) ?? new Date().toISOString(),
      };
    });

    // Determine which unique checkKeys are needed
    const neededKeys = Array.from(
      new Set(components.map(c => c.checkKey).filter((k): k is string => !!k)),
    );

    // ── 3. Run all health checks in parallel ──────────────────────────────────
    const checkResults = await Promise.all(
      neededKeys.map(async key => {
        const fn = CHECKS[key];
        if (!fn) {
          return { key, result: { healthy: true, latencyMs: 0 } };
        }
        try {
          const result = await fn();
          return { key, result };
        } catch (e: any) {
          return { key, result: { healthy: false, latencyMs: 9999, error: e.message, errorType: 'service' as const } };
        }
      }),
    );

    const resultMap = Object.fromEntries(checkResults.map(r => [r.key, r.result]));

    // ── 4. Update lastCheckedAt + latency for all components ──────────────────
    const latencyBatch = db.batch();
    for (const comp of components) {
      if (!comp.checkKey) continue;
      const result = resultMap[comp.checkKey];
      if (!result) continue;
      latencyBatch.update(db.collection('statusComponents').doc(comp.id), {
        lastCheckedAt:  FieldValue.serverTimestamp(),
        lastLatencyMs:  result.latencyMs,
      });
    }
    await latencyBatch.commit();

    // ── 5. Process state transitions ──────────────────────────────────────────
    const summary: Record<string, { before: ComponentStatus; after: ComponentStatus; latencyMs: number }> = {};

    for (const { key, result } of checkResults) {
      // Skip config errors — don't create incidents for missing API keys
      if (!result.healthy && result.errorType === 'config') {
        console.warn(`[status-cron] Config issue for ${key}: ${result.error}`);
        continue;
      }

      const newStatus     = resultToStatus(key, result);
      const affectedComps = components.filter(c => c.checkKey === key);

      // Determine the current "worst" status for this checkKey's components
      const currentWorst: ComponentStatus =
        affectedComps.some(c => c.status === 'major_outage')   ? 'major_outage'   :
        affectedComps.some(c => c.status === 'partial_outage') ? 'partial_outage' :
        affectedComps.some(c => c.status === 'degraded')       ? 'degraded'       :
        'operational';

      const wasHealthy  = currentWorst === 'operational';
      const isHealthy   = newStatus === 'operational';

      for (const comp of affectedComps) {
        summary[comp.name] = {
          before:    comp.status,
          after:     newStatus,
          latencyMs: result.latencyMs,
        };
      }

      if (!isHealthy && wasHealthy) {
        // Healthy → Degraded/Down: create incident
        await handleDownTransition(db, components, key, result, newStatus);
      } else if (isHealthy && !wasHealthy) {
        // Degraded/Down → Healthy: resolve incident
        await handleRecoveryTransition(db, components, key, result);
      } else if (!isHealthy && !wasHealthy) {
        // Still down — ensure incident exists and components are updated
        await handleDownTransition(db, components, key, result, newStatus);
      }
      // isHealthy && wasHealthy → nothing to do
    }

    const duration = Date.now() - cronStart;
    console.log(`[status-cron] Completed in ${duration}ms`);
    console.table(
      Object.fromEntries(
        checkResults.map(r => [
          r.key,
          { healthy: r.result.healthy, latencyMs: r.result.latencyMs, error: r.result.error ?? '—' },
        ]),
      ),
    );

    return NextResponse.json({
      ok:       true,
      duration,
      checks:   Object.fromEntries(
        checkResults.map(r => [r.key, {
          healthy:   r.result.healthy,
          latencyMs: r.result.latencyMs,
          error:     r.result.error,
        }]),
      ),
      summary,
    });
  } catch (error: any) {
    console.error('[status-cron] Fatal error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
