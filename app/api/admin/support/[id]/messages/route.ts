import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { notifyUser } from '@/lib/notify';

initAdmin();
const db = getFirestore();

/**
 * GET /api/admin/support/[id]/messages
 * Return the full conversation thread on a ticket.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminRequest(req, 'support:view');
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Ticket id required' }, { status: 400 });

  try {
    const snap = await db
      .collection('supportTickets').doc(id)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[admin/support/messages] Error:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

/**
 * POST /api/admin/support/[id]/messages
 * Admin posts a reply to the user's ticket thread.
 * Also bumps ticket status to 'waiting_user' (so they know it's on the user)
 * and sends a notification + email to the user.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminRequest(req, 'support:respond');
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Ticket id required' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const messageBody = (body?.body || '').toString().trim();

  if (!messageBody) return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
  if (messageBody.length > 10000) {
    return NextResponse.json({ error: 'Message is too long (max 10,000 chars)' }, { status: 400 });
  }

  try {
    const ticketRef = db.collection('supportTickets').doc(id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const ticket = ticketSnap.data() || {};
    const admin = authResult.admin;
    const now = FieldValue.serverTimestamp();

    const batch = db.batch();
    batch.set(ticketRef.collection('messages').doc(), {
      ticketId: id,
      authorType: 'admin',
      authorId: admin.uid,
      authorName: admin.username || 'Support team',
      body: messageBody,
      createdAt: now,
    });

    // Bump ticket state — admin replied, ball is in user's court now
    batch.update(ticketRef, {
      status: ticket.status === 'open' || ticket.status === 'in_progress' ? 'waiting_user' : ticket.status,
      lastAdminMessageAt: now,
      assignedTo: ticket.assignedTo || admin.uid,
      updatedAt: now,
    });

    await batch.commit();

    // Notify user (in-app + email)
    if (ticket.userId) {
      try {
        await notifyUser({
          userId: ticket.userId,
          templateType: 'support_reply',
          templateData: {
            ticketSubject: ticket.subject || 'Support Ticket',
            replyMessage: messageBody,
          },
          notification: {
            type: 'info',
            title: 'Support replied to your ticket',
            message: `New reply on "${ticket.subject || 'your ticket'}".`,
            category: 'support',
            actionUrl: `/support/tickets/${id}`,
          },
        });
      } catch (err) {
        console.error('[admin/support/messages] Failed to notify user:', err);
      }
    }

    return NextResponse.json({ message: 'Reply posted' });
  } catch (error) {
    console.error('[admin/support/messages] Error:', error);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
