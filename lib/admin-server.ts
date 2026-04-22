/**
 * Server-side admin authentication.
 * For use in API routes only — verifies the admin JWT and (optionally) a permission.
 */

import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminToken, type AdminJwtPayload } from '@/lib/admin-auth';
import { hasPermission, type AdminRole, type Permission } from '@/lib/admin-roles';

export interface AdminAuthContext {
  uid: string;            // adminUser doc id
  username: string;
  role: AdminRole;
  permissionsOverride?: Permission[] | null;
}

type VerifyResult =
  | { authorized: true; admin: AdminAuthContext }
  | { authorized: false; response: NextResponse };

/**
 * Verify the request bearer JWT, check the admin user is still active,
 * and (optionally) require a specific permission.
 */
export async function verifyAdminRequest(
  req: Request,
  requiredPermission?: Permission
): Promise<VerifyResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);

  let payload: AdminJwtPayload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      ),
    };
  }

  // Confirm the admin user still exists and is active in Firestore.
  initAdmin();
  const db = getFirestore();
  const userDoc = await db.collection('adminUsers').doc(payload.sub).get();
  if (!userDoc.exists) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Admin account no longer exists' }, { status: 401 }),
    };
  }

  const data = userDoc.data() || {};
  if (data.active === false) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Admin account is disabled' }, { status: 403 }),
    };
  }

  // Always trust the freshly-loaded role/overrides from Firestore over the token —
  // this means revoked permissions take effect on the next request.
  const role: AdminRole = data.role || payload.role;
  const overrides: Permission[] | null = data.permissionsOverride ?? payload.permissionsOverride ?? null;

  if (requiredPermission && !hasPermission(role, requiredPermission, overrides)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Missing required permission: ${requiredPermission}` },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    admin: {
      uid: payload.sub,
      username: data.username || payload.username,
      role,
      permissionsOverride: overrides,
    },
  };
}
