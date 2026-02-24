import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();
const auth = getAuth();

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { userId } = await params;
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallel fetch all user data
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const userData = userDoc.data() || {};

    // Helper: safe query — returns empty array if index missing or collection doesn't exist
    const safeQuery = async (queryFn: () => Promise<FirebaseFirestore.QuerySnapshot>) => {
      try { return await queryFn(); } catch (e) { console.warn('Query failed (may need composite index):', e); return null; }
    };
    const safeGet = async (ref: FirebaseFirestore.DocumentReference) => {
      try { return await ref.get(); } catch { return null; }
    };

    // Fetch all data in parallel — each query is individually resilient
    const [
      authRecord,
      usageDoc,
      companiesSnap,
      ticketsSnap,
      notificationsSnap,
      feedbackSnap,
      purchasesSnap,
      billingSnap,
    ] = await Promise.all([
      auth.getUser(userId).catch(() => null),
      safeGet(db.collection('users').doc(userId).collection('usage').doc(periodKey)),
      safeQuery(() => db.collection('companies').where('ownerId', '==', userId).get()),
      safeQuery(() => db.collection('supportTickets').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get()),
      safeQuery(() => db.collection('users').doc(userId).collection('notifications').orderBy('createdAt', 'desc').limit(10).get()),
      safeQuery(() => db.collection('feedback').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get()),
      safeQuery(() => db.collection('users').doc(userId).collection('tokenPurchases').orderBy('purchasedAt', 'desc').limit(10).get()),
      safeQuery(() => db.collection('users').doc(userId).collection('billingHistory').orderBy('createdAt', 'desc').limit(10).get()),
    ]);

    // Build auth info from Firebase Auth record
    const authInfo = authRecord ? {
      emailVerified: authRecord.emailVerified,
      disabled: authRecord.disabled,
      providers: authRecord.providerData.map((p: { providerId: string }) => p.providerId),
      lastSignIn: authRecord.metadata.lastSignInTime || null,
      creationTime: authRecord.metadata.creationTime || null,
      lastRefreshTime: authRecord.metadata.lastRefreshTime || null,
    } : null;

    // Subscription is stored as a field on the user document, NOT a subcollection
    const subscription = userData.subscription || null;

    // Build usage info
    const usageData = usageDoc?.exists ? usageDoc.data() : null;

    // Merge user data: prefer Firestore fields, fall back to Firebase Auth
    const mergedUser = {
      id: userDoc.id,
      name: userData.name || userData.displayName || authRecord?.displayName || null,
      email: userData.email || authRecord?.email || null,
      photoURL: userData.photoURL || authRecord?.photoURL || null,
      createdAt: userData.createdAt || authInfo?.creationTime || null,
      ...userData,
    };

    // Build data lists (safely handle null snapshots from failed queries)
    const companies = (companiesSnap?.docs || []).map(d => ({
      id: d.id,
      name: d.data().name,
      businessType: d.data().businessType,
      country: d.data().country,
      currency: d.data().currency,
      createdAt: d.data().createdAt,
    }));
    const tickets = (ticketsSnap?.docs || []).map(d => ({ id: d.id, ...d.data() }));
    const notifications = (notificationsSnap?.docs || []).map(d => ({ id: d.id, ...d.data() }));
    const feedback = (feedbackSnap?.docs || []).map(d => ({ id: d.id, ...d.data() }));
    const tokenPurchases = (purchasesSnap?.docs || []).map(d => ({ id: d.id, ...d.data() }));
    const billingHistory = (billingSnap?.docs || []).map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      user: mergedUser,
      authInfo,
      subscription,
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
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

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
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

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
