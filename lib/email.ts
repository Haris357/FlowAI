/**
 * Email Service — Resend
 * Server-side only (used in API routes)
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured.');
  }

  // Strip surrounding quotes if someone accidentally added them in the env var
  const fromEnv = (process.env.RESEND_FROM || '').trim().replace(/^["']|["']$/g, '');
  const from = fromEnv || 'Flowbooks <hello@flowbooksai.com>';

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments: attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType || 'application/pdf',
    })),
  });

  if (error) {
    console.error('Resend send failed:', error);
    throw new Error(error.message);
  }
}
