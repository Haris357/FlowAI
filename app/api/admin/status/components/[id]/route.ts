import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) return auth.response;

  const { id } = params;
  const body = await req.json();
  const allowed = ['name', 'description', 'group', 'status', 'order'];
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  await db.collection('statusComponents').doc(id).update(update);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) return auth.response;

  await db.collection('statusComponents').doc(params.id).delete();
  return NextResponse.json({ success: true });
}
