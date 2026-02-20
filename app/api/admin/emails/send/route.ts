import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, type EmailTemplateType, type EmailTemplateData } from '@/lib/email-templates';

initAdmin();
const db = getFirestore();

// ==========================================
// HELPERS
// ==========================================

async function getRecipientUsers(
  recipients: { type: 'individual' | 'all' | 'by_plan'; userId?: string; planId?: string },
): Promise<{ id: string; email: string; name?: string }[]> {
  if (recipients.type === 'individual' && recipients.userId) {
    const userDoc = await db.collection('users').doc(recipients.userId).get();
    if (!userDoc.exists) return [];
    const data = userDoc.data()!;
    return [{ id: userDoc.id, email: data.email, name: data.name }];
  }

  if (recipients.type === 'all') {
    const snapshot = await db.collection('users').get();
    return snapshot.docs
      .map(doc => ({ id: doc.id, email: doc.data().email, name: doc.data().name }))
      .filter(u => u.email);
  }

  if (recipients.type === 'by_plan' && recipients.planId) {
    // Users may store planId directly or in a subscription sub-object
    const snapshot = await db.collection('users').get();
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        const userPlan = data.planId || data.subscription?.planId || 'free';
        return { id: doc.id, email: data.email, name: data.name, planId: userPlan };
      })
      .filter(u => u.email && u.planId === recipients.planId)
      .map(({ id, email, name }) => ({ id, email, name }));
  }

  return [];
}

async function createNotification(
  userId: string,
  templateType: EmailTemplateType,
  subject: string,
) {
  const categoryMap: Record<EmailTemplateType, string> = {
    welcome: 'system',
    plan_changed: 'subscription',
    tokens_granted: 'system',
    account_warning: 'system',
    support_reply: 'support',
    announcement: 'system',
    custom: 'system',
    payment_receipt: 'subscription',
    subscription_cancelled: 'subscription',
    password_reset: 'system',
  };

  const typeMap: Record<EmailTemplateType, string> = {
    welcome: 'info',
    plan_changed: 'info',
    tokens_granted: 'success',
    account_warning: 'warning',
    support_reply: 'info',
    announcement: 'info',
    custom: 'info',
    payment_receipt: 'success',
    subscription_cancelled: 'warning',
    password_reset: 'action',
  };

  await db.collection('users').doc(userId).collection('notifications').doc().set({
    type: typeMap[templateType] || 'info',
    title: subject,
    message: `You have a new email from the Flowbooks team.`,
    read: false,
    category: categoryMap[templateType] || 'system',
    createdAt: new Date(),
  });
}

// ==========================================
// POST HANDLER
// ==========================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateType, templateData, recipients, preview } = body;

    if (!templateType || !templateData) {
      return NextResponse.json({ error: 'templateType and templateData are required' }, { status: 400 });
    }

    // Generate email content
    const { subject, html } = getEmailTemplate(templateType as EmailTemplateType, (templateData || {}) as EmailTemplateData);

    // Preview mode: return HTML without sending
    if (preview) {
      return NextResponse.json({ subject, html });
    }

    // Validate recipients
    if (!recipients?.type) {
      return NextResponse.json({ error: 'recipients.type is required' }, { status: 400 });
    }

    // Get recipient users
    const users = await getRecipientUsers(recipients);

    if (users.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 404 });
    }

    // Send emails and create notifications
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendEmail(user.email, subject, html);
        await createNotification(user.id, templateType as EmailTemplateType, subject);
        sent++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      message: `Sent ${sent} email(s)`,
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    console.error('Error in email send API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
