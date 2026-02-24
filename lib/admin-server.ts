/**
 * Server-side admin authentication.
 * For use in API routes only — imports firebase-admin.
 */

import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/admin';
import { NextResponse } from 'next/server';

/**
 * Verify that an incoming API request is from an authenticated admin.
 * Reads Authorization: Bearer <idToken> header, verifies via Firebase Admin,
 * and checks the email against the admin whitelist.
 */
export async function verifyAdminRequest(
  req: Request
): Promise<
  | { authorized: true; uid: string; email: string }
  | { authorized: false; response: NextResponse }
> {
  initAdmin();

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

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email;

    if (!isAdminEmail(email)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Access denied: not an admin' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, uid: decodedToken.uid, email: email! };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}
