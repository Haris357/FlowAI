import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

interface ActivityItem {
  id: string;
  type: 'signup' | 'subscription' | 'support' | 'feedback' | 'email' | 'token_grant';
  description: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  timestamp: Date | FirebaseFirestore.Timestamp;
  meta?: Record<string, any>;
}

function extractTimestamp(data: any, ...fields: string[]): Date {
  for (const field of fields) {
    const val = data[field];
    if (!val) continue;
    if (val._seconds) return new Date(val._seconds * 1000);
    if (val.toDate) return val.toDate();
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  }
  return new Date(0);
}

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type') || '';
    const limitParam = parseInt(searchParams.get('limit') || '50');

    const activities: ActivityItem[] = [];

    // 1. Recent user signups
    if (!typeFilter || typeFilter === 'signup') {
      try {
        const usersSnap = await db.collection('users')
          .orderBy('createdAt', 'desc')
          .limit(30)
          .get();

        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: `signup-${doc.id}`,
            type: 'signup',
            description: `New user signed up: ${data.email || data.name || doc.id}`,
            userEmail: data.email,
            userName: data.name,
            userId: doc.id,
            timestamp: extractTimestamp(data, 'createdAt'),
          });
        });
      } catch (e) {
        console.error('Error fetching signups:', e);
      }
    }

    // 2. Support tickets created
    if (!typeFilter || typeFilter === 'support') {
      try {
        const ticketsSnap = await db.collection('supportTickets')
          .orderBy('createdAt', 'desc')
          .limit(30)
          .get();

        ticketsSnap.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: `support-${doc.id}`,
            type: 'support',
            description: `Support ticket created: "${data.subject || 'Untitled'}"`,
            userEmail: data.userEmail,
            userName: data.userName,
            userId: data.userId,
            timestamp: extractTimestamp(data, 'createdAt'),
            meta: { status: data.status, priority: data.priority, category: data.category },
          });
        });
      } catch (e) {
        console.error('Error fetching support tickets:', e);
      }
    }

    // 3. Feedback submitted
    if (!typeFilter || typeFilter === 'feedback') {
      try {
        const feedbackSnap = await db.collection('feedback')
          .orderBy('createdAt', 'desc')
          .limit(30)
          .get();

        feedbackSnap.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: `feedback-${doc.id}`,
            type: 'feedback',
            description: `Feedback submitted: "${data.subject || 'Untitled'}"`,
            userEmail: data.userEmail,
            userName: data.userName,
            userId: data.userId,
            timestamp: extractTimestamp(data, 'createdAt'),
            meta: { type: data.type, rating: data.rating, status: data.status },
          });
        });
      } catch (e) {
        console.error('Error fetching feedback:', e);
      }
    }

    // 4. Announcements / admin emails
    if (!typeFilter || typeFilter === 'email') {
      try {
        const announcementsSnap = await db.collection('announcements')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        announcementsSnap.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: `email-${doc.id}`,
            type: 'email',
            description: `Admin email sent: "${data.subject || 'Untitled'}"`,
            userEmail: data.recipientEmail,
            userId: data.recipientId,
            timestamp: extractTimestamp(data, 'createdAt', 'sentAt'),
            meta: { subject: data.subject },
          });
        });
      } catch (e) {
        console.error('Error fetching announcements:', e);
      }
    }

    // 5. Subscription changes (from collectionGroup)
    if (!typeFilter || typeFilter === 'subscription') {
      try {
        const subSnap = await db.collectionGroup('subscription')
          .orderBy('updatedAt', 'desc')
          .limit(30)
          .get();

        for (const doc of subSnap.docs) {
          const data = doc.data();
          const pathParts = doc.ref.path.split('/');
          const userId = pathParts[1];

          // Only include entries that have a meaningful plan change
          if (data.planId) {
            let userEmail = '';
            try {
              const userDoc = await db.collection('users').doc(userId).get();
              if (userDoc.exists) {
                userEmail = userDoc.data()?.email || '';
              }
            } catch { /* ignore */ }

            activities.push({
              id: `sub-${doc.id}-${userId}`,
              type: 'subscription',
              description: `Subscription updated to "${data.planId}" plan`,
              userEmail,
              userId,
              timestamp: extractTimestamp(data, 'updatedAt', 'createdAt'),
              meta: { planId: data.planId, status: data.status },
            });
          }
        }
      } catch (e) {
        console.error('Error fetching subscriptions:', e);
      }
    }

    // 6. Token grants (check for tokenGrants collection or user activity logs)
    if (!typeFilter || typeFilter === 'token_grant') {
      try {
        const grantsSnap = await db.collection('tokenGrants')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        grantsSnap.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: `grant-${doc.id}`,
            type: 'token_grant',
            description: `Granted ${data.amount?.toLocaleString() || '?'} tokens to user`,
            userEmail: data.userEmail,
            userId: data.userId,
            timestamp: extractTimestamp(data, 'createdAt'),
            meta: { amount: data.amount, reason: data.reason },
          });
        });
      } catch (e) {
        // tokenGrants collection may not exist yet, silently ignore
      }
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return timeB - timeA;
    });

    // Limit to requested count
    const limited = activities.slice(0, limitParam);

    return NextResponse.json({ activities: limited });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
