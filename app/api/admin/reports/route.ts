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

    const snap = await db.collection('bugReports')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { reportId, status } = await req.json();
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 });

    await db.collection('bugReports').doc(reportId).update({ status });
    return NextResponse.json({ message: 'Report updated' });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
