import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const {
      userId, userEmail, userName, companyId, pageUrl,
      category, description, screenshotUrl, screenshotPath,
    } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    await db.collection('bugReports').add({
      userId,
      userEmail: userEmail || '',
      userName: userName || '',
      companyId: companyId || '',
      pageUrl: pageUrl || '',
      category: category || 'other',
      description: description || '',
      screenshotUrl: screenshotUrl || '',
      screenshotPath: screenshotPath || '',
      status: 'new',
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Report submitted' });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
