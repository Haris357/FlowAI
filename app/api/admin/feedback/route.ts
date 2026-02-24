import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { feedbackId, status, adminResponse } = await req.json();
    if (!feedbackId) return NextResponse.json({ error: 'feedbackId required' }, { status: 400 });

    const update: any = {};
    if (status) update.status = status;
    if (adminResponse !== undefined) update.adminResponse = adminResponse;

    await db.collection('feedback').doc(feedbackId).update(update);

    return NextResponse.json({ message: 'Feedback updated' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
