import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check admin whitelist first
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify credentials via Firebase REST API (does NOT affect client-side auth state)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok) {
      const errorCode = firebaseData?.error?.message;
      if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_PASSWORD' || errorCode === 'INVALID_LOGIN_CREDENTIALS') {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      if (errorCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Credentials verified + email is admin
    // Return the idToken so the admin panel can use it for API calls
    // without signing into the shared Firebase client auth instance
    return NextResponse.json({
      success: true,
      email: firebaseData.email,
      idToken: firebaseData.idToken,
      expiresIn: 3600, // 1 hour session
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
