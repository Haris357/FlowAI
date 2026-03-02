import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { canSendEmail } from '@/lib/email-preferences';

initAdmin();
const db = getFirestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

/**
 * Automated weekly newsletter cron job.
 * Triggered every Monday at 14:00 UTC (9:00 AM US Eastern) by Vercel Cron.
 * Generates newsletter content via AI, then sends to opted-in users.
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // 1. Generate newsletter content via AI
    let contextInfo = '';
    try {
      const statsSnap = await db.collection('appSettings').doc('newsletterContext').get();
      if (statsSnap.exists) {
        contextInfo = `\nAdditional platform context: ${JSON.stringify(statsSnap.data())}`;
      }
    } catch { /* ignore */ }

    const systemPrompt = `You are a professional newsletter writer for Flowbooks, an AI-first accounting and invoicing platform.
Flowbooks helps small businesses manage invoices, bills, bank accounts, payroll, and financial reports — all powered by AI.

Key features to reference:
- AI chat assistant for accounting questions
- Professional invoice creation and sending
- Bill tracking and purchase orders
- Bank account management and reconciliation
- Payroll and employee management
- Journal entries and chart of accounts
- Recurring transactions
- Financial reports (P&L, Balance Sheet, Cash Flow)
- Multiple company support
- Customer and vendor management

Write engaging, useful content that provides value to small business owners. Include actionable tips, feature highlights, or accounting insights.${contextInfo}`;

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const userPrompt = `Generate a weekly newsletter for the week of ${today}. The newsletter should include:
- A timely, engaging topic relevant to small business owners
- Practical tips or insights they can apply immediately
- Tone: professional yet friendly
- Number of sections: 3

Output the newsletter as JSON with this exact structure:
{
  "title": "Newsletter title (catchy, under 60 chars)",
  "sections": [
    { "heading": "Section heading", "body": "Section content (2-4 paragraphs, plain text)" }
  ],
  "footerNote": "A brief closing tip or call-to-action (1 sentence)"
}

Only output valid JSON, no markdown code blocks.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json\s*|```/g, '').trim();

    let generated;
    try {
      generated = JSON.parse(cleaned);
    } catch {
      console.error('Cron newsletter: AI generated invalid JSON:', raw);
      return NextResponse.json({ error: 'AI generated invalid content' }, { status: 500 });
    }

    const title = generated.title || 'This Week at Flowbooks';
    const sections = generated.sections || [];
    const footerNote = generated.footerNote || '';

    // 2. Get all users and check newsletter preference
    const usersSnap = await db.collection('users').limit(5000).get();
    const users = usersSnap.docs
      .map(d => ({
        id: d.id,
        email: d.data().email as string,
        name: (d.data().name || d.data().displayName || '') as string,
      }))
      .filter(u => u.email);

    // 3. Send emails in batches of 10 (respects notifyWeekly preference)
    const templateData = {
      newsletterTitle: title,
      newsletterSections: sections,
      newsletterFooterNote: footerNote,
    };

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const batchSize = 10;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          // Automated newsletters respect the notifyWeekly preference
          const allowed = await canSendEmail(user.id, 'newsletter');
          if (!allowed) {
            skipped++;
            return 'skipped';
          }

          const { subject, html } = getEmailTemplate('newsletter', {
            ...templateData,
            userName: user.name || user.email.split('@')[0],
          });
          await sendEmail(user.email, subject, html);
          return 'sent';
        })
      );

      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value === 'sent') sent++;
        else if (r.status === 'rejected') failed++;
      });
    }

    // 4. Save newsletter record
    await db.collection('newsletters').add({
      title,
      sections,
      footerNote,
      recipients: 'all',
      sent,
      failed,
      skipped,
      total: users.length,
      automated: true,
      createdAt: Timestamp.now(),
    });

    // 5. Log activity
    await db.collection('adminActivity').add({
      action: 'newsletter_auto_sent',
      details: `Automated newsletter "${title}" sent to ${sent} users (${skipped} skipped, ${failed} failed)`,
      timestamp: Timestamp.now(),
      actor: 'system',
    });

    console.log(`[Cron Newsletter] Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}, Total: ${users.length}`);

    return NextResponse.json({
      message: `Automated newsletter sent`,
      title,
      sent,
      failed,
      skipped,
      total: users.length,
    });
  } catch (error) {
    console.error('Cron newsletter error:', error);
    return NextResponse.json({ error: 'Newsletter cron failed' }, { status: 500 });
  }
}
