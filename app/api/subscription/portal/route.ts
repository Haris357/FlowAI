import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const subscriptionId = userData?.subscription?.lemonSqueezySubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy not configured' }, { status: 500 });
    }

    // Get subscription details to find customer portal URL
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    const result = await response.json();
    const portalUrl = result.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json({ error: 'Customer portal URL not available' }, { status: 404 });
    }

    return NextResponse.json({ portalUrl });
  } catch (error: any) {
    console.error('[Portal] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
