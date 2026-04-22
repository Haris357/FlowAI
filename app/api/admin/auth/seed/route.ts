import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { hashPassword, normalizeUsername } from '@/lib/admin-auth';

initAdmin();
const db = getFirestore();

/**
 * One-time bootstrap: creates the default super_admin user if no admin users exist.
 * Safe to call repeatedly — refuses if the collection is non-empty.
 *
 * Default credentials:
 *   username: admin
 *   password: Admin@123
 *
 * Call once after deploy:
 *   curl -X POST http://localhost:3000/api/admin/auth/seed
 */
export async function POST() {
  try {
    const existing = await db.collection('adminUsers').limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Admin users already exist — seed endpoint is disabled.',
        },
        { status: 409 }
      );
    }

    const username = normalizeUsername('admin');
    const passwordHash = await hashPassword('Admin@123');

    const ref = await db.collection('adminUsers').add({
      username,
      passwordHash,
      name: 'Default Admin',
      role: 'super_admin',
      permissionsOverride: null,
      active: true,
      createdBy: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: null,
    });

    return NextResponse.json({
      ok: true,
      message: 'Default super_admin created. Log in with username "admin" / password "Admin@123" and change it immediately.',
      id: ref.id,
    });
  } catch (error) {
    console.error('[admin/auth/seed] Error:', error);
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 });
  }
}

export async function GET() {
  // Allow checking from a browser whether seed is needed.
  const existing = await db.collection('adminUsers').limit(1).get();
  return NextResponse.json({
    seeded: !existing.empty,
    count: existing.size,
  });
}
