import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'notifications:view');
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type') || '';
    const categoryFilter = searchParams.get('category') || '';
    const readFilter = searchParams.get('read') || '';
    const limitParam = parseInt(searchParams.get('limit') || '100');

    // Use collectionGroup to query notifications across all users
    let query: FirebaseFirestore.Query = db.collectionGroup('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limitParam);

    const snap = await query.get();

    let notifications: any[] = snap.docs.map(doc => {
      const data = doc.data();
      // Extract userId from the document path: users/{userId}/notifications/{notificationId}
      const pathParts = doc.ref.path.split('/');
      const userId = pathParts[1];
      return {
        id: doc.id,
        userId,
        ...data,
      };
    });

    // Enrich with user email
    const userIds = Array.from(new Set(notifications.map(n => n.userId)));
    const userMap: Record<string, string> = {};

    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userMap[uid] = userData?.email || userData?.name || uid;
          } else {
            userMap[uid] = uid;
          }
        } catch {
          userMap[uid] = uid;
        }
      })
    );

    notifications = notifications.map(n => ({
      ...n,
      userEmail: userMap[n.userId] || n.userId,
    }));

    // Apply filters client-side
    if (typeFilter) {
      notifications = notifications.filter(n => n.type === typeFilter);
    }
    if (categoryFilter) {
      notifications = notifications.filter(n => n.category === categoryFilter);
    }
    if (readFilter === 'read') {
      notifications = notifications.filter(n => n.read === true);
    } else if (readFilter === 'unread') {
      notifications = notifications.filter(n => n.read === false);
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'notifications:send');
    if (!authResult.authorized) return authResult.response;

    const { userId, type, title, message, category, actionUrl } = await req.json();

    if (!userId || !type || !title || !message || !category) {
      return NextResponse.json(
        { error: 'userId, type, title, message, and category are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifData: Record<string, any> = {
      type,
      title,
      message,
      category,
      read: false,
      createdAt: new Date(),
    };

    if (actionUrl) {
      notifData.actionUrl = actionUrl;
    }

    const ref = db.collection('users').doc(userId).collection('notifications').doc();
    await ref.set(notifData);

    return NextResponse.json({ message: 'Notification created', id: ref.id });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'notifications:delete');
    if (!authResult.authorized) return authResult.response;

    const { userId, notificationId } = await req.json();

    if (!userId || !notificationId) {
      return NextResponse.json(
        { error: 'userId and notificationId are required' },
        { status: 400 }
      );
    }

    await db.collection('users').doc(userId).collection('notifications').doc(notificationId).delete();

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
