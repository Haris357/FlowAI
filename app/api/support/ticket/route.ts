import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { ADMIN_EMAILS } from '@/lib/admin';

initAdmin();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, userName, subject, category, priority, description } = body;

    if (!userId || !subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create ticket in Firestore
    const ticketRef = db.collection('supportTickets').doc();
    const now = new Date();
    await ticketRef.set({
      userId,
      userEmail: userEmail || '',
      userName: userName || '',
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      description,
      attachmentUrls: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create notification for the user
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    await notifRef.set({
      type: 'success',
      title: 'Ticket Submitted',
      message: `Your support ticket "${subject}" has been submitted. We'll get back to you soon.`,
      read: false,
      category: 'support',
      actionUrl: '/settings?section=support',
      createdAt: now,
    });

    // Send email notification to admin
    try {
      const adminEmail = ADMIN_EMAILS[0];
      if (adminEmail) {
        await sendEmail(
          adminEmail,
          `[Support Ticket] ${subject}`,
          `
          <h2>New Support Ticket</h2>
          <p><strong>From:</strong> ${userName || 'Unknown'} (${userEmail})</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <p>${description.replace(/\n/g, '<br/>')}</p>
          <hr/>
          <p><small>Ticket ID: ${ticketRef.id}</small></p>
          `
        );
      }
    } catch (emailErr) {
      console.error('Failed to send admin email for ticket:', emailErr);
    }

    return NextResponse.json({ id: ticketRef.id, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
