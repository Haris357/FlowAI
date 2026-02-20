import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

export async function GET() {
  try {
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
        await db.collection('users').doc(ticket.userId).collection('notifications').doc().set({
          type: 'success',
          title: 'Ticket Resolved',
          message: `Your support ticket "${ticket.subject}" has been resolved.`,
          read: false,
          category: 'support',
          actionUrl: '/settings?section=support',
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
