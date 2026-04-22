import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const adminDb = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'feedback:view');
    if (!authResult.authorized) return authResult.response;

    const snap = await adminDb.doc('appSettings/feedback').get();
    return NextResponse.json({
      settings: snap.exists ? snap.data() : { enabled: true },
    });
  } catch {
    return NextResponse.json({ settings: { enabled: true } });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'feedback:respond');
    if (!authResult.authorized) return authResult.response;

    const body = await req.json();
    await adminDb.doc('appSettings/feedback').set(body, { merge: true });
    return NextResponse.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
