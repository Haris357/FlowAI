import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { isAdminEmail } from '@/lib/admin';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'users:view');
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || '';

    let query: FirebaseFirestore.Query = db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(limitParam);

    const snap = await query.get();
    let users = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => !isAdminEmail((u as any).email));

    // Client-side search filter (Firestore doesn't support text search)
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u =>
        (u as any).name?.toLowerCase().includes(s) ||
        (u as any).email?.toLowerCase().includes(s)
      );
    }

    // Subscription is stored as a field on the user document (not a subcollection)
    const enriched = users.map(user => ({
      ...user,
      subscription: (user as any).subscription || null,
    }));

    // Plan filter
    let filtered = enriched;
    if (planFilter) {
      filtered = enriched.filter(u => (u.subscription?.planId || 'free') === planFilter);
    }

    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
