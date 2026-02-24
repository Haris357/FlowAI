import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    // Parallel fetch all counts
    const [usersSnap, ticketsSnap, feedbackSnap, companiesSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('supportTickets').where('status', '==', 'open').count().get(),
      db.collection('feedback').where('status', '==', 'new').count().get(),
      db.collection('companies').count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const openTickets = ticketsSnap.data().count;
    const newFeedback = feedbackSnap.data().count;
    const totalCompanies = companiesSnap.data().count;

    // Get recent users (last 7 days) count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsersCountSnap = await db.collection('users')
      .where('createdAt', '>=', weekAgo)
      .count()
      .get();
    const newUsersThisWeek = recentUsersCountSnap.data().count;

    // Get subscription distribution
    const subsSnap = await db.collectionGroup('subscription').get();
    const planDist: Record<string, number> = { free: 0, pro: 0, max: 0 };
    subsSnap.docs.forEach(doc => {
      const planId = doc.data().planId || 'free';
      if (planDist[planId] !== undefined) planDist[planId]++;
    });

    // Get recent users (for dashboard sidebar)
    const recentUsersSnap = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();
    const recentUsers = recentUsersSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      photoURL: doc.data().photoURL,
      createdAt: doc.data().createdAt,
    }));

    // Build recent activity from multiple sources
    const recentActivity: Array<{ type: string; description: string; timestamp: any }> = [];

    // Recent signups
    const recentSignups = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    recentSignups.docs.forEach(doc => {
      const data = doc.data();
      recentActivity.push({
        type: 'signup',
        description: `${data.name || data.email || 'User'} signed up`,
        timestamp: data.createdAt,
      });
    });

    // Recent tickets
    try {
      const recentTickets = await db.collection('supportTickets')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      recentTickets.docs.forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          type: 'ticket',
          description: `Support ticket: ${data.subject || 'No subject'}`,
          timestamp: data.createdAt,
        });
      });
    } catch {
      // Collection may not exist yet
    }

    // Recent feedback
    try {
      const recentFeedback = await db.collection('feedback')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      recentFeedback.docs.forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          type: 'feedback',
          description: `Feedback: ${data.subject || data.type || 'No subject'}`,
          timestamp: data.createdAt,
        });
      });
    } catch {
      // Collection may not exist yet
    }

    // Recent announcements
    try {
      const recentAnnouncements = await db.collection('announcements')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
      recentAnnouncements.docs.forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          type: 'announcement',
          description: `Announcement: ${data.title || 'Untitled'}`,
          timestamp: data.createdAt,
        });
      });
    } catch {
      // Collection may not exist yet
    }

    // Sort by timestamp (most recent first)
    recentActivity.sort((a, b) => {
      const getTime = (ts: any) => {
        if (!ts) return 0;
        if (ts._seconds) return ts._seconds * 1000;
        if (ts.toDate) return ts.toDate().getTime();
        return new Date(ts).getTime();
      };
      return getTime(b.timestamp) - getTime(a.timestamp);
    });

    return NextResponse.json({
      totalUsers,
      newUsersThisWeek,
      openTickets,
      newFeedback,
      totalCompanies,
      planDistribution: planDist,
      recentUsers,
      recentActivity: recentActivity.slice(0, 15),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
