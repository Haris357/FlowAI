import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import {
  computeUptimeHistory,
  computeUptimePercentage,
  getOverallStatus,
  type StatusComponent,
  type StatusIncident,
} from '@/lib/status-page';

initAdmin();

function toDate(ts: FirebaseFirestore.Timestamp | Date | string | null | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts instanceof Date) return ts.toISOString();
  return (ts as FirebaseFirestore.Timestamp).toDate().toISOString();
}

export async function GET() {
  try {
    const db = getFirestore();

    // ── Components ──────────────────────────────────────────────────────────
    const compSnap = await db.collection('statusComponents')
      .orderBy('order', 'asc')
      .get();

    const components: StatusComponent[] = compSnap.docs.map(d => {
      const data = d.data();
      return {
        id:          d.id,
        name:        data.name,
        description: data.description ?? '',
        group:       data.group,
        status:      data.status,
        order:       data.order,
        createdAt:   toDate(data.createdAt),
        updatedAt:   toDate(data.updatedAt),
      };
    });

    // ── Incidents (last 90 days + all unresolved) ────────────────────────────
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const incSnap = await db.collection('statusIncidents')
      .orderBy('createdAt', 'desc')
      .get();

    const incidents: StatusIncident[] = await Promise.all(
      incSnap.docs
        .filter(d => {
          const data = d.data();
          const resolved = data.resolvedAt ? toDate(data.resolvedAt) : null;
          const created  = toDate(data.createdAt);
          // Include if unresolved OR created within last 90 days
          return !resolved || new Date(created) >= ninetyDaysAgo;
        })
        .map(async d => {
          const data = d.data();
          const updatesSnap = await d.ref.collection('updates')
            .orderBy('createdAt', 'asc')
            .get();
          const updates = updatesSnap.docs.map(u => ({
            id:        u.id,
            status:    u.data().status,
            message:   u.data().message,
            createdAt: toDate(u.data().createdAt),
          }));
          return {
            id:                  d.id,
            title:               data.title,
            status:              data.status,
            impact:              data.impact,
            affectedComponents:  data.affectedComponents ?? [],
            createdAt:           toDate(data.createdAt),
            resolvedAt:          data.resolvedAt ? toDate(data.resolvedAt) : null,
            updatedAt:           toDate(data.updatedAt),
            updates,
          };
        }),
    );

    // ── Maintenances ─────────────────────────────────────────────────────────
    const maintSnap = await db.collection('statusMaintenances')
      .orderBy('scheduledStart', 'asc')
      .get();

    const maintenances = maintSnap.docs.map(d => {
      const data = d.data();
      return {
        id:                 d.id,
        title:              data.title,
        description:        data.description ?? '',
        status:             data.status,
        impact:             data.impact,
        affectedComponents: data.affectedComponents ?? [],
        scheduledStart:     toDate(data.scheduledStart),
        scheduledEnd:       toDate(data.scheduledEnd),
        createdAt:          toDate(data.createdAt),
        updatedAt:          toDate(data.updatedAt),
      };
    });

    // ── Uptime history ────────────────────────────────────────────────────────
    const uptimeHistory: Record<string, { history: ReturnType<typeof computeUptimeHistory>; uptime: number }> = {};
    for (const comp of components) {
      const history = computeUptimeHistory(comp.id, incidents);
      uptimeHistory[comp.id] = { history, uptime: computeUptimePercentage(history) };
    }

    const overallStatus = getOverallStatus(components);

    return NextResponse.json(
      {
        status:        overallStatus,
        components,
        incidents,
        maintenances,
        uptimeHistory,
        updatedAt:     new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      },
    );
  } catch (error) {
    console.error('[/api/status] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch status data' }, { status: 500 });
  }
}
