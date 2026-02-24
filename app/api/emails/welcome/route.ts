import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

export async function POST(req: Request) {
  try {
    const { userId, userName, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing userId or userEmail' }, { status: 400 });
    }

    // Check if welcome email was already sent (idempotency)
    const userRef = adminDb.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (userSnap.exists && userSnap.data()?.welcomeEmailSent) {
      return NextResponse.json({ message: 'Welcome email already sent' });
    }

    // Generate and send welcome email
    const { subject, html } = getEmailTemplate('welcome', {
      userName: userName || userEmail.split('@')[0],
    });

    await sendEmail(userEmail, subject, html);

    // Mark welcome email as sent
    await userRef.update({ welcomeEmailSent: true, welcomeEmailSentAt: Timestamp.now() });

    // Create in-app notification
    await adminDb.collection(`users/${userId}/notifications`).add({
      type: 'success',
      title: 'Welcome to Flowbooks!',
      message: 'Your account is ready. Start by creating your first company and invoice.',
      category: 'system',
      read: false,
      actionUrl: '/companies',
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ message: 'Welcome email sent' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
