import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

function toISO(ts: FirebaseFirestore.Timestamp | null | undefined): string | null {
  if (!ts) return null;
  return ts.toDate().toISOString();
}

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req, 'status:view');
  if (!auth.authorized) return auth.response;

  const snap = await db.collection('statusIncidents')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  const incidents = await Promise.all(
    snap.docs.map(async d => {
      const data = d.data();
      const updatesSnap = await d.ref.collection('updates')
        .orderBy('createdAt', 'asc')
        .get();
      const updates = updatesSnap.docs.map(u => ({
        id:        u.id,
        status:    u.data().status,
        message:   u.data().message,
        createdAt: toISO(u.data().createdAt) ?? new Date().toISOString(),
      }));
      return {
        id:                 d.id,
        title:              data.title,
        status:             data.status,
        impact:             data.impact,
        affectedComponents: data.affectedComponents ?? [],
        createdAt:          toISO(data.createdAt) ?? new Date().toISOString(),
        resolvedAt:         toISO(data.resolvedAt),
        updatedAt:          toISO(data.updatedAt) ?? new Date().toISOString(),
        updates,
      };
    }),
  );

  return NextResponse.json({ incidents });
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req, 'status:manage');
  if (!auth.authorized) return auth.response;

  const { title, impact, affectedComponents, message } = await req.json();
  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const now = FieldValue.serverTimestamp();
  const ref = await db.collection('statusIncidents').add({
    title,
    status:             'investigating',
    impact:             impact ?? 'minor',
    affectedComponents: affectedComponents ?? [],
    createdAt:          now,
    resolvedAt:         null,
    updatedAt:          now,
  });

  // Add the first update
  await ref.collection('updates').add({
    status:    'investigating',
    message,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update affected component statuses
  if (Array.isArray(affectedComponents) && affectedComponents.length > 0) {
    const statusMap: Record<string, string> = {
      none:     'operational',
      minor:    'degraded',
      major:    'partial_outage',
      critical: 'major_outage',
    };
    const componentStatus = statusMap[impact ?? 'minor'] ?? 'degraded';
    const batch = db.batch();
    for (const compId of affectedComponents) {
      batch.update(db.collection('statusComponents').doc(compId), {
        status:    componentStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return NextResponse.json({ id: ref.id });
}
