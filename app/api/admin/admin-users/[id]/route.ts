import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { hashPassword, validatePassword } from '@/lib/admin-auth';
import { ADMIN_ROLES, type AdminRole, type Permission } from '@/lib/admin-roles';

initAdmin();
const db = getFirestore();

function sanitize(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};
  const { passwordHash, ...rest } = data;
  return { id: doc.id, ...rest };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminRequest(req, 'admin_users:view');
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const doc = await db.collection('adminUsers').doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }
  return NextResponse.json({ user: sanitize(doc) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminRequest(req, 'admin_users:manage');
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;
    const ref = db.collection('adminUsers').doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length > 80) {
        return NextResponse.json({ error: 'Name must be 1–80 characters' }, { status: 400 });
      }
      update.name = name;
    }

    if (typeof body.role === 'string') {
      if (!ADMIN_ROLES.includes(body.role as AdminRole)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      // Prevent self-demotion away from super_admin if you're the only one.
      if (existing.id === authResult.admin.uid && body.role !== 'super_admin' && existing.data()?.role === 'super_admin') {
        const others = await db.collection('adminUsers')
          .where('role', '==', 'super_admin')
          .where('active', '==', true)
          .get();
        const otherSupers = others.docs.filter(d => d.id !== existing.id);
        if (otherSupers.length === 0) {
          return NextResponse.json(
            { error: 'You are the only active super_admin — promote another user before changing your role.' },
            { status: 400 }
          );
        }
      }
      update.role = body.role;
    }

    if ('permissionsOverride' in body) {
      const ov = body.permissionsOverride;
      if (ov !== null && !Array.isArray(ov)) {
        return NextResponse.json({ error: 'permissionsOverride must be an array or null' }, { status: 400 });
      }
      update.permissionsOverride = ov as Permission[] | null;
    }

    if (typeof body.active === 'boolean') {
      // Prevent disabling yourself.
      if (existing.id === authResult.admin.uid && body.active === false) {
        return NextResponse.json(
          { error: 'You cannot disable your own account.' },
          { status: 400 }
        );
      }
      update.active = body.active;
    }

    await ref.update(update);
    const updated = await ref.get();
    return NextResponse.json({ user: sanitize(updated), message: 'Admin user updated' });
  } catch (error) {
    console.error('[admin-users] Update error:', error);
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminRequest(req, 'admin_users:manage');
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;

    if (id === authResult.admin.uid) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const ref = db.collection('adminUsers').doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Prevent deleting the last super_admin.
    if (existing.data()?.role === 'super_admin') {
      const others = await db.collection('adminUsers')
        .where('role', '==', 'super_admin')
        .where('active', '==', true)
        .get();
      const otherSupers = others.docs.filter(d => d.id !== id);
      if (otherSupers.length === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the last active super_admin.' },
          { status: 400 }
        );
      }
    }

    await ref.delete();
    return NextResponse.json({ message: 'Admin user deleted' });
  } catch (error) {
    console.error('[admin-users] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 });
  }
}
