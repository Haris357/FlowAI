import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { notifyUser } from '@/lib/notify';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'feedback:view');
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
    const authResult = await verifyAdminRequest(req, 'feedback:respond');
    if (!authResult.authorized) return authResult.response;

    const { feedbackId, status, adminResponse } = await req.json();
    if (!feedbackId) return NextResponse.json({ error: 'feedbackId required' }, { status: 400 });

    const update: any = {};
    if (status) update.status = status;
    if (adminResponse !== undefined) update.adminResponse = adminResponse;

    await db.collection('feedback').doc(feedbackId).update(update);

    // Notify user when feedback is acknowledged or responded to
    if (status === 'acknowledged' || adminResponse) {
      try {
        const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
        const feedback = feedbackDoc.data();
        if (feedback?.userId) {
          await notifyUser({
            userId: feedback.userId,
            templateType: 'feedback_acknowledged',
            templateData: {
              feedbackSubject: feedback.subject || feedback.type || 'Your feedback',
              feedbackResponse: adminResponse || 'Your feedback has been reviewed by our team. Thank you for helping us improve!',
            },
            notification: {
              type: 'success',
              title: 'Feedback Acknowledged',
              message: `Your feedback "${feedback.subject || feedback.type || 'submission'}" has been reviewed.`,
              category: 'system',
              actionUrl: '/settings?section=feedback',
            },
          });
        }
      } catch (notifyErr) {
        console.error('Failed to notify user about feedback:', notifyErr);
      }
    }

    return NextResponse.json({ message: 'Feedback updated' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
