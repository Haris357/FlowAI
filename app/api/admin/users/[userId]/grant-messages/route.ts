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
        bonusTokens: FieldValue.increment(messages),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create a fresh usage doc with bonus tokens
      await usageRef.set({
        userId,
        planId: 'free',
        sessionStart: Timestamp.now(),
        sessionTokensUsed: 0,
        sessionLimit: 0,
        sessionDurationMs: 0,
        weekStart: getCurrentWeekStart(),
        weeklyTokensUsed: 0,
        weeklyLimit: 0,
        bonusTokens: messages,
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
      title: 'Bonus Weekly AI Usage Added',
      message: `Bonus AI usage has been added to your weekly allowance by the admin team!`,
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

    return NextResponse.json({ message: `Granted ${messages} bonus weekly tokens` });
  } catch (error) {
    console.error('Error granting bonus tokens:', error);
    return NextResponse.json({ error: 'Failed to grant bonus tokens' }, { status: 500 });
  }
}
