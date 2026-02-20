import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';

initAdmin();
const db = getFirestore();

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { planId } = await req.json();

    if (!['free', 'pro', 'max'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const subRef = db.collection('users').doc(userId).collection('subscription').doc('current');
    const now = new Date();

    await subRef.set({
      planId,
      status: 'active',
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      lemonSqueezyVariantId: null,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      cancelAt: null,
      updatedAt: now,
      adminOverride: true,
    }, { merge: true });

    const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

    // Create notification
    await db.collection('users').doc(userId).collection('notifications').doc().set({
      type: 'success',
      title: 'Plan Updated',
      message: `Your plan has been changed to ${planLabel} by the admin team.`,
      read: false,
      category: 'subscription',
      actionUrl: '/settings?section=subscription',
      createdAt: now,
    });

    // Send email notification
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData?.email) {
        const template = getEmailTemplate('plan_changed', {
          userName: userData.name || userData.email.split('@')[0],
          planName: planLabel,
        });
        await sendEmail(userData.email, template.subject, template.html);
      }
    } catch (emailErr) {
      console.error('Failed to send plan change email:', emailErr);
    }

    return NextResponse.json({ message: `Plan changed to ${planId}` });
  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 });
  }
}
