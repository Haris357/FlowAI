import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { notifyUser } from '@/lib/notify';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'support:view');
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('supportTickets')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'support:respond');
    if (!authResult.authorized) return authResult.response;

    const { ticketId, status, adminNotes, rejectionReason, assignedTo } = await req.json();
    if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const ticket = ticketSnap.data() || {};

    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;

    if (status === 'resolved') {
      update.resolvedAt = FieldValue.serverTimestamp();
    }
    if (status === 'rejected') {
      update.rejectedAt = FieldValue.serverTimestamp();
      if (typeof rejectionReason === 'string') {
        update.rejectionReason = rejectionReason.trim();
      }
    }

    await ticketRef.update(update);

    // User notifications + optional status-message appended to the thread
    const messagesCol = ticketRef.collection('messages');
    const now = FieldValue.serverTimestamp();

    try {
      if (status === 'resolved' && ticket.userId) {
        const replyBody = adminNotes
          ? `Your ticket has been resolved.\n\nAdmin notes: ${adminNotes}`
          : 'Your ticket has been reviewed and resolved. If you have any further questions, feel free to reply here or open a new ticket.';

        await messagesCol.add({
          ticketId,
          authorType: 'system',
          authorId: 'system',
          authorName: 'Flowbooks Support',
          body: 'Ticket marked as resolved by the support team.',
          createdAt: now,
        });

        await notifyUser({
          userId: ticket.userId,
          templateType: 'support_reply',
          templateData: {
            ticketSubject: ticket.subject || 'Support Ticket',
            replyMessage: replyBody,
          },
          notification: {
            type: 'success',
            title: 'Ticket resolved',
            message: `Your support ticket "${ticket.subject}" has been resolved.`,
            category: 'support',
            actionUrl: `/support/tickets/${ticketId}`,
          },
        });
      } else if (status === 'rejected' && ticket.userId) {
        await messagesCol.add({
          ticketId,
          authorType: 'system',
          authorId: 'system',
          authorName: 'Flowbooks Support',
          body: `Ticket rejected.${rejectionReason ? `\n\nReason: ${rejectionReason}` : ''}`,
          createdAt: now,
        });

        await notifyUser({
          userId: ticket.userId,
          templateType: 'support_reply',
          templateData: {
            ticketSubject: ticket.subject || 'Support Ticket',
            replyMessage: `Your ticket was rejected.${rejectionReason ? `\n\nReason: ${rejectionReason}` : ''}\n\nYou can reply on the ticket page if you need further help.`,
          },
          notification: {
            type: 'warning',
            title: 'Ticket rejected',
            message: `Your support ticket "${ticket.subject}" was rejected.`,
            category: 'support',
            actionUrl: `/support/tickets/${ticketId}`,
          },
        });
      } else if (status === 'in_progress' && ticket.userId) {
        await messagesCol.add({
          ticketId,
          authorType: 'system',
          authorId: 'system',
          authorName: 'Flowbooks Support',
          body: 'The support team started working on this ticket.',
          createdAt: now,
        });

        await notifyUser({
          userId: ticket.userId,
          templateType: 'ticket_in_progress',
          templateData: { ticketSubject: ticket.subject || 'Support Ticket' },
          notification: {
            type: 'info',
            title: 'Ticket in progress',
            message: `Your support ticket "${ticket.subject}" is being worked on.`,
            category: 'support',
            actionUrl: `/support/tickets/${ticketId}`,
          },
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify user about ticket update:', notifyErr);
    }

    return NextResponse.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
