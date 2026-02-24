import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { verifyAdminRequest } from '@/lib/admin-server';

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

    // Notify user if resolved
    if (status === 'resolved') {
      const ticketDoc = await db.collection('supportTickets').doc(ticketId).get();
      const ticket = ticketDoc.data();
      if (ticket?.userId) {
        // Create in-app notification
        await db.collection('users').doc(ticket.userId).collection('notifications').doc().set({
          type: 'success',
          title: 'Ticket Resolved',
          message: `Your support ticket "${ticket.subject}" has been resolved.`,
          read: false,
          category: 'support',
          actionUrl: '/settings?section=support',
          createdAt: new Date(),
        });

        // Send email notification
        try {
          const userDoc = await db.collection('users').doc(ticket.userId).get();
          const userData = userDoc.data();
          if (userData?.email) {
            const replyMessage = adminNotes
              ? `Your ticket has been resolved.\n\nAdmin notes: ${adminNotes}`
              : 'Your ticket has been reviewed and resolved. If you have any further questions, feel free to open a new ticket.';

            const { subject, html } = getEmailTemplate('support_reply', {
              userName: userData.name || userData.email.split('@')[0],
              ticketSubject: ticket.subject || 'Support Ticket',
              replyMessage,
            });
            await sendEmail(userData.email, subject, html);
          }
        } catch (emailErr) {
          console.error('Failed to send ticket resolved email:', emailErr);
        }
      }
    }

    return NextResponse.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
