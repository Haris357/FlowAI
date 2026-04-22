import { NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
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

  const snap = await db.collection('statusMaintenances')
    .orderBy('scheduledStart', 'desc')
    .limit(100)
    .get();

  const maintenances = snap.docs.map(d => {
    const data = d.data();
    return {
      id:                 d.id,
      title:              data.title,
      description:        data.description ?? '',
      status:             data.status,
      impact:             data.impact,
      affectedComponents: data.affectedComponents ?? [],
      scheduledStart:     toISO(data.scheduledStart) ?? '',
      scheduledEnd:       toISO(data.scheduledEnd) ?? '',
      createdAt:          toISO(data.createdAt) ?? new Date().toISOString(),
      updatedAt:          toISO(data.updatedAt) ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ maintenances });
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req, 'status:manage');
  if (!auth.authorized) return auth.response;

  const { title, description, impact, affectedComponents, scheduledStart, scheduledEnd } =
    await req.json();

  if (!title || !scheduledStart || !scheduledEnd) {
    return NextResponse.json(
      { error: 'title, scheduledStart, and scheduledEnd are required' },
      { status: 400 },
    );
  }

  const now = FieldValue.serverTimestamp();
  const ref = await db.collection('statusMaintenances').add({
    title,
    description:        description ?? '',
    status:             'scheduled',
    impact:             impact ?? 'minor',
    affectedComponents: affectedComponents ?? [],
    scheduledStart:     Timestamp.fromDate(new Date(scheduledStart)),
    scheduledEnd:       Timestamp.fromDate(new Date(scheduledEnd)),
    createdAt:          now,
    updatedAt:          now,
  });

  return NextResponse.json({ id: ref.id });
}
