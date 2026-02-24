import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { canSendEmail } from '@/lib/email-preferences';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const adminDb = getFirestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// ==========================================
// GET — List past newsletters
// ==========================================

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const snap = await adminDb
      .collection('newsletters')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const newsletters = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json({ newsletters: [] });
  }
}

// ==========================================
// POST — Generate or Send newsletter
// ==========================================

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      return handleGenerate(body);
    }

    if (action === 'send') {
      return handleSend(body);
    }

    return NextResponse.json({ error: 'Invalid action. Use "generate" or "send".' }, { status: 400 });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Newsletter operation failed' }, { status: 500 });
  }
}

// ==========================================
// GENERATE — AI creates newsletter content
// ==========================================

async function handleGenerate(body: {
  topic?: string;
  tone?: string;
  sections?: number;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const topic = body.topic || 'weekly update for an AI-first accounting platform';
  const tone = body.tone || 'professional yet friendly';
  const sectionCount = body.sections || 3;

  // Fetch recent platform stats for context
  let contextInfo = '';
  try {
    const statsSnap = await adminDb.collection('appSettings').doc('newsletterContext').get();
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

  const userPrompt = `Generate a newsletter with the following specifications:
- Topic/Theme: ${topic}
- Tone: ${tone}
- Number of sections: ${sectionCount}

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

  // Parse JSON response (strip markdown fences if present)
  let parsed;
  try {
    const cleaned = raw.replace(/```json\s*|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'AI generated invalid content. Please try again.', raw }, { status: 500 });
  }

  return NextResponse.json({
    generated: {
      title: parsed.title || 'This Week at Flowbooks',
      sections: parsed.sections || [],
      footerNote: parsed.footerNote || '',
    },
  });
}

// ==========================================
// SEND — Send newsletter to users
// ==========================================

async function handleSend(body: {
  title: string;
  sections: Array<{ heading: string; body: string }>;
  footerNote?: string;
  recipients: 'all' | 'free' | 'pro' | 'max';
}) {
  const { title, sections, footerNote, recipients } = body;

  if (!title || !sections?.length) {
    return NextResponse.json({ error: 'Missing title or sections' }, { status: 400 });
  }

  // Fetch target users
  let usersQuery: FirebaseFirestore.Query = adminDb.collection('users');

  if (recipients === 'free') {
    // Free users either have no subscription or subscription.planId === 'free'
    // We'll fetch all and filter client-side since Firestore can't query nested OR conditions well
  } else if (recipients === 'pro') {
    usersQuery = usersQuery.where('subscription.planId', '==', 'pro');
  } else if (recipients === 'max') {
    usersQuery = usersQuery.where('subscription.planId', '==', 'max');
  }
  // 'all' = no filter

  const usersSnap = await usersQuery.limit(5000).get();
  let users = usersSnap.docs.map(d => ({
    id: d.id,
    email: d.data().email as string,
    name: (d.data().name || d.data().displayName || '') as string,
    planId: d.data().subscription?.planId || 'free',
  })).filter(u => u.email);

  // Filter for free users (no subscription field or planId === 'free')
  if (recipients === 'free') {
    users = users.filter(u => u.planId === 'free');
  }

  // Generate template
  const templateData = {
    newsletterTitle: title,
    newsletterSections: sections,
    newsletterFooterNote: footerNote || '',
  };

  // Send emails in batches of 10, respecting user email preferences
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const batchSize = 10;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (user) => {
        // Check if user has opted into newsletter/weekly emails
        const allowed = await canSendEmail(user.id, 'newsletter');
        if (!allowed) {
          skipped++;
          return;
        }

        const { subject, html } = getEmailTemplate('newsletter', {
          ...templateData,
          userName: user.name || user.email.split('@')[0],
        });
        await sendEmail(user.email, subject, html);
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') sent++;
      else failed++;
    });
  }

  // Adjust sent count (skipped users counted as fulfilled but didn't actually send)
  sent -= skipped;

  // Save newsletter record
  await adminDb.collection('newsletters').add({
    title,
    sections,
    footerNote: footerNote || '',
    recipients,
    sent,
    failed,
    total: users.length,
    createdAt: Timestamp.now(),
  });

  return NextResponse.json({
    message: `Newsletter sent to ${sent} user(s)`,
    sent,
    failed,
    total: users.length,
  });
}
