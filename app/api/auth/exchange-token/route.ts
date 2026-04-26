import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json().catch(() => ({}));
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await getAuth().verifyIdToken(idToken);
    const customToken = await getAuth().createCustomToken(decoded.uid);

    const res = NextResponse.json({ customToken });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('[auth/exchange-token] Error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
