import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();
const auth = getAuth();

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
 * POST /api/support/tickets/[id]/messages
 * Add a user reply to a ticket's conversation thread.
 * Also re-opens the ticket if it was resolved/closed (so admins see the fresh reply).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Ticket id is required' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const messageBody = (body?.body || '').toString().trim();

  if (!messageBody) return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
  if (messageBody.length > 10000) {
    return NextResponse.json({ error: 'Message is too long (max 10,000 chars)' }, { status: 400 });
  }

  try {
    const ticketRef = db.collection('supportTickets').doc(id);
    const ticket = await ticketRef.get();
    if (!ticket.exists) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const data = ticket.data() || {};
    if (data.userId !== user.uid) {
      return NextResponse.json({ error: 'Not your ticket' }, { status: 403 });
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const userName = userData.name || userData.displayName || data.userName || 'You';

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();

    batch.set(ticketRef.collection('messages').doc(), {
      ticketId: id,
      authorType: 'user',
      authorId: user.uid,
      authorName: userName,
      body: messageBody,
      createdAt: now,
    });

    // Re-open the ticket if it was resolved/closed/rejected and bump activity timestamps
    const newStatus = ['resolved', 'closed', 'rejected'].includes(data.status)
      ? 'open'
      : data.status === 'waiting_user' ? 'in_progress' : data.status;

    batch.update(ticketRef, {
      status: newStatus,
      lastUserMessageAt: now,
      updatedAt: now,
    });

    await batch.commit();

    return NextResponse.json({ message: 'Reply added' });
  } catch (error) {
    console.error('[support/tickets/messages] Error:', error);
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 });
  }
}
