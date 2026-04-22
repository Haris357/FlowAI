import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import {
  hashPassword, normalizeUsername, validatePassword, validateUsername,
} from '@/lib/admin-auth';
import { ADMIN_ROLES, type AdminRole, type Permission } from '@/lib/admin-roles';

initAdmin();
const db = getFirestore();

function sanitize(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};
  // Never expose passwordHash.
  const { passwordHash, ...rest } = data;
  return { id: doc.id, ...rest };
}

export async function GET(req: Request) {
  const authResult = await verifyAdminRequest(req, 'admin_users:view');
  if (!authResult.authorized) return authResult.response;

  try {
    const snap = await db.collection('adminUsers').orderBy('createdAt', 'asc').get();
    const users = snap.docs.map(sanitize);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[admin-users] List error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await verifyAdminRequest(req, 'admin_users:manage');
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username || '');
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = (body?.name || '').toString().trim();
    const role = body?.role as AdminRole;
    const permissionsOverride = Array.isArray(body?.permissionsOverride)
      ? (body.permissionsOverride as Permission[])
      : null;

    // Validations
    const u = validateUsername(username);
    if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });

    const p = validatePassword(password);
    if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });

    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!name || name.length < 1 || name.length > 80) {
      return NextResponse.json({ error: 'Name is required (1–80 characters)' }, { status: 400 });
    }

    // Uniqueness
    const dupe = await db.collection('adminUsers')
      .where('username', '==', username)
      .limit(1)
      .get();
    if (!dupe.empty) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const ref = await db.collection('adminUsers').add({
      username,
      passwordHash,
      name,
      role,
      permissionsOverride,
      active: true,
      createdBy: authResult.admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: null,
    });

    const created = await ref.get();
    return NextResponse.json({ user: sanitize(created), message: 'Admin user created' });
  } catch (error) {
    console.error('[admin-users] Create error:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}
