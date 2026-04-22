import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import {
  hashPassword, verifyPassword, validatePassword,
} from '@/lib/admin-auth';

initAdmin();
const db = getFirestore();

/**
 * Reset/change an admin user's password.
 *
 * - If the target is the caller themselves: requires `currentPassword`.
 * - If the target is someone else: requires `admin_users:manage` permission
 *   and no current password is needed (admin reset).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // First verify the caller is authenticated (no permission required yet — depends on target).
  const authResult = await verifyAdminRequest(req);
  if (!authResult.authorized) return authResult.response;

  const isSelf = id === authResult.admin.uid;
  if (!isSelf) {
    // Re-verify with permission requirement for resetting other users' passwords.
    const managerCheck = await verifyAdminRequest(req, 'admin_users:manage');
    if (!managerCheck.authorized) return managerCheck.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';

    const v = validatePassword(newPassword);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const ref = db.collection('adminUsers').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    if (isSelf) {
      const ok = await verifyPassword(currentPassword, doc.data()?.passwordHash || '');
      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await ref.update({
      passwordHash,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Password updated' });
  } catch (error) {
    console.error('[admin-users/password] Error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
