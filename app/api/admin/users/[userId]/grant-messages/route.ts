import { NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { verifyAdminRequest } from '@/lib/admin-server';
import { getCurrentWeekStart } from '@/lib/plans';

initAdmin();
const db = getFirestore();

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { userId } = await params;
    const { messages } = await req.json();

    if (!messages || messages <= 0) {
      return NextResponse.json({ error: 'Invalid message amount' }, { status: 400 });
    }

    // Write to usage/current doc (bonus messages apply to weekly pool)
    const usageRef = db.collection('users').doc(userId).collection('usage').doc('current');
    const usageSnap = await usageRef.get();

    if (usageSnap.exists) {
      await usageRef.update({
        bonusMessages: FieldValue.increment(messages),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create a fresh usage doc with bonus messages
      await usageRef.set({
        userId,
        planId: 'free',
        sessionStart: Timestamp.now(),
        sessionMessagesUsed: 0,
        sessionLimit: 25,
        sessionDurationMs: 5 * 60 * 60 * 1000,
        weekStart: getCurrentWeekStart(),
        weeklyMessagesUsed: 0,
        weeklyLimit: 150,
        bonusMessages: messages,
        totalTokensConsumed: 0,
        costAccumulated: 0,
        requestCount: 0,
        breakdown: {},
        updatedAt: Timestamp.now(),
      });
    }

    // Create notification
    await db.collection('users').doc(userId).collection('notifications').doc().set({
      type: 'success',
      title: 'Bonus Weekly Messages Added',
      message: `You've received ${messages.toLocaleString()} bonus weekly AI messages from the admin team!`,
      read: false,
      category: 'ai',
      createdAt: new Date(),
    });

    // Send email notification
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData?.email) {
        const template = getEmailTemplate('messages_granted', {
          userName: userData.name || userData.email.split('@')[0],
          messageAmount: messages,
        });
        await sendEmail(userData.email, template.subject, template.html);
      }
    } catch (emailErr) {
      console.error('Failed to send message grant email:', emailErr);
    }

    return NextResponse.json({ message: `Granted ${messages} bonus weekly messages` });
  } catch (error) {
    console.error('Error granting messages:', error);
    return NextResponse.json({ error: 'Failed to grant messages' }, { status: 500 });
  }
}
