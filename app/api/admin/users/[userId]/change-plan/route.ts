import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { PLANS } from '@/lib/plans';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { userId } = await params;
    const { planId } = await req.json();

    if (!['free', 'pro', 'max'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Fetch user to get current plan and email
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const previousPlanId = userData.subscription?.planId || 'free';
    const previousPlanLabel = PLANS[previousPlanId as keyof typeof PLANS]?.name || 'Free';
    const newPlanLabel = PLANS[planId as keyof typeof PLANS]?.name || planId.charAt(0).toUpperCase() + planId.slice(1);

    const now = Timestamp.now();

    // Update subscription as a field on the user document (not subcollection)
    await db.collection('users').doc(userId).update({
      subscription: {
        planId,
        status: 'active',
        lemonSqueezyCustomerId: userData.subscription?.lemonSqueezyCustomerId || null,
        lemonSqueezySubscriptionId: userData.subscription?.lemonSqueezySubscriptionId || null,
        lemonSqueezyVariantId: userData.subscription?.lemonSqueezyVariantId || null,
        currentPeriodStart: now,
        currentPeriodEnd: Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())),
        cancelAt: null,
        updatedAt: now,
        adminOverride: true,
      },
    });

    // Create in-app notification
    await db.collection('users').doc(userId).collection('notifications').doc().set({
      type: 'success',
      title: 'Plan Updated',
      message: `Your plan has been changed from ${previousPlanLabel} to ${newPlanLabel} by the admin team.`,
      read: false,
      category: 'subscription',
      actionUrl: '/settings/billing',
      createdAt: new Date(),
    });

    // Send email notification
    try {
      if (userData.email) {
        const template = getEmailTemplate('plan_changed', {
          userName: userData.name || userData.email.split('@')[0],
          planName: newPlanLabel,
          previousPlan: previousPlanLabel,
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
