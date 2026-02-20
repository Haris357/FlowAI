import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, type, subject, description, rating } = body;

    if (!userId || !subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create feedback in Firestore
    const feedbackRef = db.collection('feedback').doc();
    const now = new Date();
    await feedbackRef.set({
      userId,
      userEmail: userEmail || '',
      type: type || 'suggestion',
      subject,
      description,
      ...(rating && { rating }),
      status: 'new',
      createdAt: now,
    });

    // Create notification for the user
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    await notifRef.set({
      type: 'success',
      title: 'Feedback Received',
      message: `Thank you for your feedback: "${subject}". We appreciate your input!`,
      read: false,
      category: 'support',
      actionUrl: '/settings?section=feedback',
      createdAt: now,
    });

    return NextResponse.json({ id: feedbackRef.id, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
