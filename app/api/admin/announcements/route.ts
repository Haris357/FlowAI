import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { canSendEmail } from '@/lib/email-preferences';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

// ==========================================
// GET — Fetch past announcements
// ==========================================

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'announcements:view');
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const announcements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// ==========================================
// POST — Create and send announcement
// ==========================================

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'announcements:create');
    if (!authResult.authorized) return authResult.response;

    const { title, message, type, target, actionUrl, sendEmail: shouldSendEmail } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    if (!['info', 'warning', 'success', 'action'].includes(type)) {
      return NextResponse.json({ error: 'Invalid announcement type' }, { status: 400 });
    }

    if (!['all', 'free_users', 'pro_users', 'max_users'].includes(target)) {
      return NextResponse.json({ error: 'Invalid target audience' }, { status: 400 });
    }

    // 1. Get target users — subscription is stored as a field on the user document
    const usersSnap = await db.collection('users').limit(5000).get();
    let targetUsers: Array<{ id: string; email?: string; name?: string }> = [];

    if (target === 'all') {
      targetUsers = usersSnap.docs.map(d => ({
        id: d.id,
        email: d.data().email,
        name: d.data().name,
      }));
    } else {
      const planMap: Record<string, string> = {
        free_users: 'free',
        pro_users: 'pro',
        max_users: 'max',
      };
      const targetPlan = planMap[target];

      targetUsers = usersSnap.docs
        .filter(d => {
          const planId = d.data().subscription?.planId || 'free';
          return planId === targetPlan;
        })
        .map(d => ({
          id: d.id,
          email: d.data().email,
          name: d.data().name,
        }));
    }

    // 2. Save announcement to Firestore
    const announcementData = {
      title,
      message,
      type,
      target,
      actionUrl: actionUrl || null,
      sendEmail: !!shouldSendEmail,
      recipientCount: targetUsers.length,
      createdAt: new Date(),
    };

    const announcementRef = await db.collection('announcements').add(announcementData);

    // 3. Create in-app notification for each target user
    const BATCH_LIMIT = 500;
    let batchCount = 0;
    let currentBatch = db.batch();
    const batches: FirebaseFirestore.WriteBatch[] = [currentBatch];

    for (const user of targetUsers) {
      if (batchCount >= BATCH_LIMIT) {
        currentBatch = db.batch();
        batches.push(currentBatch);
        batchCount = 0;
      }

      const notifRef = db.collection('users').doc(user.id)
        .collection('notifications').doc();

      currentBatch.set(notifRef, {
        type,
        title,
        message,
        read: false,
        category: 'announcement',
        actionUrl: actionUrl || null,
        announcementId: announcementRef.id,
        createdAt: new Date(),
      });
      batchCount++;
    }

    // Commit all batches
    await Promise.all(batches.map(b => b.commit()));

    // 4. Optionally send email using the template system (respects user preferences)
    let emailsSent = 0;
    let emailsSkipped = 0;
    if (shouldSendEmail) {
      const CONCURRENCY = 10;
      for (let i = 0; i < targetUsers.length; i += CONCURRENCY) {
        const chunk = targetUsers.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          chunk
            .filter(u => u.email)
            .map(async (u) => {
              const allowed = await canSendEmail(u.id, 'announcement');
              if (!allowed) {
                emailsSkipped++;
                return 'skipped';
              }
              const { subject, html } = getEmailTemplate('announcement', {
                userName: u.name || u.email?.split('@')[0],
                announcementTitle: title,
                announcementBody: message,
              });
              await sendEmail(u.email!, subject, html);
              return 'sent';
            })
        );
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value === 'sent') emailsSent++;
        });
      }
    }

    return NextResponse.json({
      message: 'Announcement sent successfully',
      announcementId: announcementRef.id,
      recipientCount: targetUsers.length,
      emailsSent,
      emailsSkipped,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
