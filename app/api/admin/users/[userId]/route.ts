import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();
const auth = getAuth();

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallel fetch all user data
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      authRecord,
      subDoc,
      usageDoc,
      companiesSnap,
      ticketsSnap,
      notificationsSnap,
      feedbackSnap,
      purchasesSnap,
      billingSnap,
    ] = await Promise.all([
      // Firebase Auth record
      auth.getUser(userId).catch(() => null),
      // Subscription
      db.collection('users').doc(userId).collection('subscription').doc('current').get(),
      // Current usage period
      db.collection('users').doc(userId).collection('usage').doc(periodKey).get(),
      // Companies (full list, not just count)
      db.collection('companies').where('ownerId', '==', userId).get(),
      // Support tickets
      db.collection('supportTickets')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
      // Recent notifications
      db.collection('users').doc(userId).collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
      // Feedback
      db.collection('feedback')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
      // Token purchases
      db.collection('users').doc(userId).collection('tokenPurchases')
        .orderBy('purchasedAt', 'desc')
        .limit(10)
        .get(),
      // Billing history
      db.collection('users').doc(userId).collection('billingHistory')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
    ]);

    // Build auth info
    const authInfo = authRecord ? {
      emailVerified: authRecord.emailVerified,
      disabled: authRecord.disabled,
      providers: authRecord.providerData.map(p => p.providerId),
      lastSignIn: authRecord.metadata.lastSignInTime || null,
      creationTime: authRecord.metadata.creationTime || null,
      lastRefreshTime: authRecord.metadata.lastRefreshTime || null,
    } : null;

    // Build usage info
    const usageData = usageDoc.exists ? usageDoc.data() : null;

    // Build companies list
    const companies = companiesSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      businessType: doc.data().businessType,
      country: doc.data().country,
      currency: doc.data().currency,
      createdAt: doc.data().createdAt,
    }));

    // Build tickets
    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build notifications
    const notifications = notificationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build feedback
    const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build token purchases
    const tokenPurchases = purchasesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build billing history
    const billingHistory = billingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      user: { id: userDoc.id, ...userDoc.data() },
      authInfo,
      subscription: subDoc.exists ? subDoc.data() : null,
      usage: usageData,
      usagePeriod: periodKey,
      companies,
      companiesCount: companies.length,
      tickets,
      notifications,
      feedback,
      tokenPurchases,
      billingHistory,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const body = await req.json();

    await db.collection('users').doc(userId).update({
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(userId);
    } catch (authErr) {
      console.error('Error deleting auth user:', authErr);
    }

    // Delete Firestore user doc
    await db.collection('users').doc(userId).delete();

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
