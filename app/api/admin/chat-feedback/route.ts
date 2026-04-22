import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'feedback:view');
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('chatFeedback')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching chat feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch chat feedback' }, { status: 500 });
  }
}
