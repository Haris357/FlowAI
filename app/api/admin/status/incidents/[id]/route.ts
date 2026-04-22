import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req, 'status:manage');
  if (!auth.authorized) return auth.response;

  const { id } = params;
  const body = await req.json();
  const { status, impact, affectedComponents, title } = body;

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (title)              update.title              = title;
  if (status)             update.status             = status;
  if (impact)             update.impact             = impact;
  if (affectedComponents) update.affectedComponents = affectedComponents;

  // Mark resolved
  if (status === 'resolved') {
    update.resolvedAt = FieldValue.serverTimestamp();

    // Restore affected components to operational
    const incDoc = await db.collection('statusIncidents').doc(id).get();
    const compIds: string[] = incDoc.data()?.affectedComponents ?? [];
    if (compIds.length > 0) {
      const batch = db.batch();
      for (const compId of compIds) {
        batch.update(db.collection('statusComponents').doc(compId), {
          status:    'operational',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  await db.collection('statusIncidents').doc(id).update(update);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req, 'status:manage');
  if (!auth.authorized) return auth.response;

  // Delete subcollection updates first
  const updatesSnap = await db.collection('statusIncidents').doc(params.id)
    .collection('updates').get();
  const batch = db.batch();
  updatesSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(db.collection('statusIncidents').doc(params.id));
  await batch.commit();

  return NextResponse.json({ success: true });
}
