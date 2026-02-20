import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';

initAdmin();
const db = getFirestore();

// ==========================================
// GET — Fetch past announcements
// ==========================================

export async function GET() {
  try {
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

    // 1. Get target users
    const usersSnap = await db.collection('users').get();
    let targetUsers: Array<{ id: string; email?: string; name?: string }> = [];

    if (target === 'all') {
      targetUsers = usersSnap.docs.map(d => ({
        id: d.id,
        email: d.data().email,
        name: d.data().name,
      }));
    } else {
      // Filter by plan — need to check each user's subscription
      const planMap: Record<string, string> = {
        free_users: 'free',
        pro_users: 'pro',
        max_users: 'max',
      };
      const targetPlan = planMap[target];

      const usersWithSubs = await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          try {
            const subSnap = await db.collection('users').doc(userDoc.id)
              .collection('subscription').doc('current').get();
            const planId = subSnap.exists ? (subSnap.data()?.planId || 'free') : 'free';
            return {
              id: userDoc.id,
              email: userData.email,
              name: userData.name,
              planId,
            };
          } catch {
            return {
              id: userDoc.id,
              email: userData.email,
              name: userData.name,
              planId: 'free',
            };
          }
        })
      );

      targetUsers = usersWithSubs.filter(u => u.planId === targetPlan);
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
    const batch = db.batch();
    const BATCH_LIMIT = 500;
    let batchCount = 0;
    const batches: FirebaseFirestore.WriteBatch[] = [batch];

    for (const user of targetUsers) {
      const notifRef = db.collection('users').doc(user.id)
        .collection('notifications').doc();

      let currentBatch = batches[batches.length - 1];
      if (batchCount >= BATCH_LIMIT) {
        const newBatch = db.batch();
        batches.push(newBatch);
        currentBatch = newBatch;
        batchCount = 0;
      }

      currentBatch.set(notifRef, {
        type,
        title,
        message,
        read: false,
        category: 'system',
        actionUrl: actionUrl || null,
        announcementId: announcementRef.id,
        createdAt: new Date(),
      });
      batchCount++;
    }

    // Commit all batches
    await Promise.all(batches.map(b => b.commit()));

    // 4. Optionally send email to all targeted users
    if (shouldSendEmail) {
      const emailHtml = buildAnnouncementEmail(title, message, type, actionUrl);
      const emailSubject = `Flowbooks: ${title}`;

      // Send emails in parallel with concurrency limit
      const CONCURRENCY = 10;
      for (let i = 0; i < targetUsers.length; i += CONCURRENCY) {
        const chunk = targetUsers.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
          chunk
            .filter(u => u.email)
            .map(u => sendEmail(u.email!, emailSubject, emailHtml))
        );
      }
    }

    return NextResponse.json({
      message: 'Announcement sent successfully',
      announcementId: announcementRef.id,
      recipientCount: targetUsers.length,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}

// ==========================================
// Email template helper
// ==========================================

function buildAnnouncementEmail(
  title: string,
  message: string,
  type: string,
  actionUrl?: string,
): string {
  const typeColors: Record<string, string> = {
    info: '#3B82F6',
    warning: '#F59E0B',
    success: '#10B981',
    action: '#D97757',
  };
  const accentColor = typeColors[type] || '#D97757';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="padding: 32px 24px; border-bottom: 3px solid ${accentColor};">
        <h2 style="color: #D97757; margin: 0 0 24px 0; font-size: 20px;">Flowbooks</h2>
        <h1 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">${title}</h1>
        <div style="color: #4a4a4a; font-size: 15px; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</div>
        ${actionUrl ? `
          <div style="margin-top: 24px;">
            <a href="${actionUrl.startsWith('http') ? actionUrl : `https://flowbooks.app${actionUrl}`}"
               style="display: inline-block; padding: 10px 24px; background: ${accentColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
              Learn More
            </a>
          </div>
        ` : ''}
      </div>
      <div style="padding: 16px 24px;">
        <p style="color: #999; font-size: 12px; margin: 0;">This email was sent from the Flowbooks team. You are receiving this because you have an account on Flowbooks.</p>
      </div>
    </div>
  `;
}
