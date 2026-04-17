import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

const API_BASE = 'https://api.lemonsqueezy.com/v1';

async function lsRequest(path: string, method: string, body?: any) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) throw new Error('Lemon Squeezy not configured');

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[LS API] ${method} ${path} failed:`, err);
    throw new Error(`Lemon Squeezy API error: ${res.status}`);
  }

  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const subscriptionId = userData?.subscription?.lemonSqueezySubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const path = `/subscriptions/${subscriptionId}`;

    switch (action) {
      case 'cancel': {
        // Lemon Squeezy DELETE schedules cancellation at the end of the billing period.
        // The subscription remains active until `ends_at`, then is terminated.
        await lsRequest(path, 'DELETE');
        return NextResponse.json({
          success: true,
          message: 'Your subscription has been cancelled. You will keep access until the end of your current billing period.',
        });
      }

      case 'resume': {
        // Reactivate a cancelled-but-still-active subscription before the period ends.
        await lsRequest(path, 'PATCH', {
          data: {
            type: 'subscriptions',
            id: subscriptionId,
            attributes: { cancelled: false },
          },
        });
        return NextResponse.json({ success: true, message: 'Subscription resumed' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Subscription Manage] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
