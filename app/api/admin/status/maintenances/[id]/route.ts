import { NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  const allowed = ['title', 'description', 'status', 'impact', 'affectedComponents'];
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (body.scheduledStart) update.scheduledStart = Timestamp.fromDate(new Date(body.scheduledStart));
  if (body.scheduledEnd)   update.scheduledEnd   = Timestamp.fromDate(new Date(body.scheduledEnd));

  await db.collection('statusMaintenances').doc(params.id).update(update);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) return auth.response;

  await db.collection('statusMaintenances').doc(params.id).delete();
  return NextResponse.json({ success: true });
}
