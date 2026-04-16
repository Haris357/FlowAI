import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) return auth.response;

  const { status, message } = await req.json();
  if (!status || !message) {
    return NextResponse.json({ error: 'status and message are required' }, { status: 400 });
  }

  const incidentRef = db.collection('statusIncidents').doc(params.id);
  const updateRef   = incidentRef.collection('updates').doc();

  const batch = db.batch();
  batch.set(updateRef, {
    status,
    message,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(incidentRef, {
    status,
    updatedAt: FieldValue.serverTimestamp(),
    ...(status === 'resolved' ? { resolvedAt: FieldValue.serverTimestamp() } : {}),
  });

  // Restore components when resolved
  if (status === 'resolved') {
    const incDoc = await incidentRef.get();
    const compIds: string[] = incDoc.data()?.affectedComponents ?? [];
    for (const compId of compIds) {
      batch.update(db.collection('statusComponents').doc(compId), {
        status:    'operational',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
  return NextResponse.json({ id: updateRef.id });
}
