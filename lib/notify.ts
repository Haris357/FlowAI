/**
 * Centralized notification utility.
 * Sends both an in-app notification (Firestore) and an email (Resend) in one call.
 * Non-blocking — won't throw if email/notification fails.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import type { EmailTemplateType, EmailTemplateData } from '@/lib/email-templates';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

interface NotifyOptions {
  userId: string;
  templateType: EmailTemplateType;
  templateData: EmailTemplateData | Record<string, any>;
  notification: {
    type: 'info' | 'success' | 'warning' | 'action';
    title: string;
    message: string;
    category: string;
    actionUrl?: string;
  };
  skipEmail?: boolean;
}

/**
 * Send an email + in-app notification to a user.
 * Non-blocking: logs errors but never throws.
 */
export async function notifyUser(options: NotifyOptions): Promise<void> {
  const { userId, templateType, templateData, notification, skipEmail } = options;

  try {
    // Get user info
    const userSnap = await db.doc(`users/${userId}`).get();
    if (!userSnap.exists) return;
    const userData = userSnap.data()!;
    const userName = userData.name || userData.email?.split('@')[0] || 'User';

    // Create in-app notification
    await db.collection(`users/${userId}/notifications`).add({
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    });

    // Send email (non-blocking)
    if (!skipEmail && userData.email) {
      try {
        const { subject, html } = getEmailTemplate(templateType, {
          ...templateData,
          userName,
        });
        await sendEmail(userData.email, subject, html);
      } catch (err) {
        console.error(`[notifyUser] Failed to email user ${userId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[notifyUser] Failed to notify user ${userId}:`, err);
  }
}
