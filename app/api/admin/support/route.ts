import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { notifyUser } from '@/lib/notify';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('supportTickets')
      .orderBy('createdAt', 'desc')
      .limit(100)
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
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { ticketId, status, adminNotes } = await req.json();
    if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

    const update: any = { updatedAt: new Date() };
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (status === 'resolved') update.resolvedAt = new Date();

    await db.collection('supportTickets').doc(ticketId).update(update);

    // Notify user on status changes
    if (status === 'resolved' || status === 'in_progress') {
      try {
        const ticketDoc = await db.collection('supportTickets').doc(ticketId).get();
        const ticket = ticketDoc.data();
        if (ticket?.userId) {
          if (status === 'resolved') {
            const replyMessage = adminNotes
              ? `Your ticket has been resolved.\n\nAdmin notes: ${adminNotes}`
              : 'Your ticket has been reviewed and resolved. If you have any further questions, feel free to open a new ticket.';

            await notifyUser({
              userId: ticket.userId,
              templateType: 'support_reply',
              templateData: {
                ticketSubject: ticket.subject || 'Support Ticket',
                replyMessage,
              },
              notification: {
                type: 'success',
                title: 'Ticket Resolved',
                message: `Your support ticket "${ticket.subject}" has been resolved.`,
                category: 'support',
                actionUrl: '/settings?section=support',
              },
            });
          } else if (status === 'in_progress') {
            await notifyUser({
              userId: ticket.userId,
              templateType: 'ticket_in_progress',
              templateData: {
                ticketSubject: ticket.subject || 'Support Ticket',
              },
              notification: {
                type: 'info',
                title: 'Ticket In Progress',
                message: `Your support ticket "${ticket.subject}" is being worked on.`,
                category: 'support',
                actionUrl: '/settings?section=support',
              },
            });
          }
        }
      } catch (notifyErr) {
        console.error('Failed to notify user about ticket update:', notifyErr);
      }
    }

    return NextResponse.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
