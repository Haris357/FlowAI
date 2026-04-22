import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { ROLE_PERMISSIONS, type Permission } from '@/lib/admin-roles';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  const authResult = await verifyAdminRequest(req);
  if (!authResult.authorized) return authResult.response;

  const { admin } = authResult;

  const doc = await db.collection('adminUsers').doc(admin.uid).get();
  const data = doc.data() || {};

  // Resolve effective permissions: per-user override (if set) wins over role defaults.
  const effective: Permission[] =
    admin.permissionsOverride && admin.permissionsOverride.length > 0
      ? admin.permissionsOverride
      : ROLE_PERMISSIONS[admin.role] || [];

  return NextResponse.json({
    admin: {
      id: admin.uid,
      username: admin.username,
      name: data.name || admin.username,
      role: admin.role,
      permissions: effective,
      permissionsOverride: admin.permissionsOverride || null,
      active: data.active !== false,
      lastLoginAt: data.lastLoginAt || null,
      createdAt: data.createdAt || null,
    },
  });
}
