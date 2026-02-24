import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { userId } = await params;
    const { tokens } = await req.json();

    if (!tokens || tokens <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
    }

    // Get current usage period
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = db.collection('users').doc(userId).collection('usage').doc(periodKey);
    const usageSnap = await usageRef.get();

    if (usageSnap.exists) {
      await usageRef.update({
        bonusTokens: FieldValue.increment(tokens),
      });
    } else {
      await usageRef.set({
        tokensUsed: 0,
        bonusTokens: tokens,
        periodStart: now,
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      });
    }

    // Create notification
    await db.collection('users').doc(userId).collection('notifications').doc().set({
      type: 'success',
      title: 'Bonus Tokens Added',
      message: `You've received ${tokens.toLocaleString()} bonus AI tokens from the admin team!`,
      read: false,
      category: 'ai',
      createdAt: now,
    });

    // Send email notification
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData?.email) {
        const template = getEmailTemplate('tokens_granted', {
          userName: userData.name || userData.email.split('@')[0],
          tokenAmount: tokens,
        });
        await sendEmail(userData.email, template.subject, template.html);
      }
    } catch (emailErr) {
      console.error('Failed to send token grant email:', emailErr);
    }

    return NextResponse.json({ message: `Granted ${tokens} tokens` });
  } catch (error) {
    console.error('Error granting tokens:', error);
    return NextResponse.json({ error: 'Failed to grant tokens' }, { status: 500 });
  }
}
