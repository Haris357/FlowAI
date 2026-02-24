import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
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
    const body = await req.json();
    const {
      templateType = 'custom',
      userName,
      customSubject,
      customMessage,
      planName,
      tokenAmount,
      warningMessage,
      ticketSubject,
      replyMessage,
      // Legacy support: subject + message fields
      subject: legacySubject,
      message: legacyMessage,
    } = body;

    // Get user email
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = userDoc.data()?.email;
    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    const resolvedUserName = userName || userDoc.data()?.name || email.split('@')[0];

    let emailSubject: string;
    let emailHtml: string;
    let notificationTitle: string;
    let notificationMessage: string;

    // Use template system if templateType is provided and not 'custom' legacy
    if (templateType && templateType !== 'custom') {
      const template = getEmailTemplate(templateType, {
        userName: resolvedUserName,
        userEmail: email,
        planName,
        tokenAmount: tokenAmount ? parseInt(tokenAmount) : undefined,
        warningMessage,
        ticketSubject,
        replyMessage,
      });
      emailSubject = template.subject;
      emailHtml = template.html;
      notificationTitle = template.subject;
      notificationMessage = `You have a new email from Flowbooks: ${template.subject}`;
    } else {
      // Legacy custom email
      const sub = customSubject || legacySubject;
      const msg = customMessage || legacyMessage;

      if (!sub || !msg) {
        return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });
      }

      const template = getEmailTemplate('custom', {
        userName: resolvedUserName,
        customSubject: sub,
        customMessage: msg,
      });
      emailSubject = template.subject;
      emailHtml = template.html;
      notificationTitle = 'Message from Admin';
      notificationMessage = sub;
    }

    await sendEmail(email, emailSubject, emailHtml);

    // Create notification
    await db.collection('users').doc(userId).collection('notifications').doc().set({
      type: 'info',
      title: notificationTitle,
      message: notificationMessage,
      read: false,
      category: 'system',
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
