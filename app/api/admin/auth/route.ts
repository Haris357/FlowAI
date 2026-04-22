import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import {
  signAdminToken, verifyPassword, normalizeUsername,
} from '@/lib/admin-auth';
import type { AdminRole, Permission } from '@/lib/admin-roles';

initAdmin();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username || '');
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Look up admin by username (stored lowercase).
    const snap = await db.collection('adminUsers')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snap.empty) {
      // Same response as wrong password to avoid leaking whether the username exists.
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.active === false) {
      return NextResponse.json({ error: 'This account is disabled' }, { status: 403 });
    }

    const ok = await verifyPassword(password, data.passwordHash || '');
    if (!ok) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Issue JWT.
    const role = (data.role || 'viewer') as AdminRole;
    const permissionsOverride = (data.permissionsOverride || null) as Permission[] | null;
    const { token, expiresIn } = signAdminToken({
      sub: doc.id,
      username: data.username,
      role,
      permissionsOverride,
    });

    // Update last login timestamp (best-effort).
    doc.ref.update({ lastLoginAt: FieldValue.serverTimestamp() }).catch(() => {});

    return NextResponse.json({
      success: true,
      token,
      expiresIn,
      admin: {
        id: doc.id,
        username: data.username,
        name: data.name || data.username,
        role,
        permissionsOverride,
      },
    });
  } catch (error) {
    console.error('[admin/auth] Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
