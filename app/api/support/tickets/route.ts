import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';

initAdmin();
const db = getFirestore();
const auth = getAuth();

/**
 * Verify the request's Firebase ID token (from the main app's client SDK).
 * Returns the decoded user or null.
 */
async function verifyUser(req: Request) {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    return await auth.verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}

/**
 * POST /api/support/tickets
 * Create a support ticket. Requires a Firebase ID token.
 * Body: { subject, category, priority, description, fromAiChat?, transcript? }
 *   - transcript: optional array of { role: 'user' | 'ai', content } messages
 *     pre-seeded from the AI chatbot conversation (escalation path).
 */
export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const subject = (body?.subject || '').toString().trim();
  const description = (body?.description || '').toString().trim();
  const category = ['bug', 'feature_request', 'billing', 'account', 'general'].includes(body?.category)
    ? body.category : 'general';
  const priority = ['low', 'medium', 'high', 'urgent'].includes(body?.priority)
    ? body.priority : 'medium';
  const fromAiChat = !!body?.fromAiChat;
  const transcript = Array.isArray(body?.transcript) ? body.transcript : [];

  if (!subject || !description) {
    return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: 'Subject must be 200 characters or fewer' }, { status: 400 });
  }
  if (description.length > 10000) {
    return NextResponse.json({ error: 'Description is too long (max 10,000 chars)' }, { status: 400 });
  }

  try {
    // Pull the user profile for name/email
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const userEmail = userData.email || user.email || '';
    const userName = userData.name || userData.displayName || user.name || (userEmail.split('@')[0] || 'User');

    const now = FieldValue.serverTimestamp();
    const ticketRef = db.collection('supportTickets').doc();

    await ticketRef.set({
      userId: user.uid,
      userEmail,
      userName,
      subject,
      category,
      priority,
      status: 'open',
      description,
      attachmentUrls: [],
      fromAiChat,
      assignedTo: null,
      lastUserMessageAt: now,
      lastAdminMessageAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Seed the conversation thread: first the original description, then any AI transcript.
    const batch = db.batch();
    const messagesCol = ticketRef.collection('messages');

    batch.set(messagesCol.doc(), {
      ticketId: ticketRef.id,
      authorType: 'user',
      authorId: user.uid,
      authorName: userName,
      body: description,
      createdAt: now,
    });

    if (fromAiChat && transcript.length > 0) {
      // Pre-seed the AI conversation so admins have full context on arrival.
      let ordinal = 0;
      for (const entry of transcript) {
        if (!entry || typeof entry.content !== 'string' || !entry.content.trim()) continue;
        const role: 'user' | 'ai' = entry.role === 'user' ? 'user' : 'ai';
        batch.set(messagesCol.doc(), {
          ticketId: ticketRef.id,
          authorType: role === 'user' ? 'user' : 'ai',
          authorId: role === 'user' ? user.uid : 'assistant',
          authorName: role === 'user' ? userName : 'Flowbooks AI',
          body: entry.content.slice(0, 10000),
          createdAt: FieldValue.serverTimestamp(),
          _ord: ordinal++,
        });
      }
    }

    // In-app notification to the user
    batch.set(db.collection('users').doc(user.uid).collection('notifications').doc(), {
      type: 'success',
      title: 'Ticket submitted',
      message: `Your support ticket "${subject}" has been submitted. We will get back to you soon.`,
      read: false,
      category: 'support',
      actionUrl: `/support/tickets/${ticketRef.id}`,
      createdAt: now,
    });

    await batch.commit();

    // Fire-and-forget email to admin (don't block the user response)
    const adminEmailTarget = process.env.SUPPORT_INBOX_EMAIL || 'support@flowbooksai.com';
    sendEmail(
      adminEmailTarget,
      `[Support Ticket] ${subject}`,
      `
      <h2>New Support Ticket</h2>
      <p><strong>From:</strong> ${userName} (${userEmail})</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Priority:</strong> ${priority}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      ${fromAiChat ? '<p><em>Escalated from the AI chatbot.</em></p>' : ''}
      <hr/>
      <p style="white-space:pre-wrap">${description.replace(/</g, '&lt;')}</p>
      <hr/>
      <p><small>Ticket ID: ${ticketRef.id}</small></p>
      `
    ).catch(err => console.error('[support/tickets] Failed to email admin:', err));

    return NextResponse.json({ id: ticketRef.id, message: 'Ticket created' });
  } catch (error) {
    console.error('[support/tickets] Error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
