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
    const customerId = userData?.subscription?.lemonSqueezyCustomerId;

    if (!subscriptionId && !customerId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      console.error('[Portal] LEMON_SQUEEZY_API_KEY is not set');
      return NextResponse.json({ error: 'Payment portal is not configured' }, { status: 500 });
    }

    const lsHeaders = {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    } as const;

    let portalUrl: string | null = null;

    // Try to get a signed URL from the subscription first (most reliable)
    if (subscriptionId) {
      const subRes = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
        { headers: lsHeaders },
      );
      if (!subRes.ok) {
        const text = await subRes.text().catch(() => '');
        console.error(`[Portal] Subscription fetch failed (${subRes.status}):`, text);
      } else {
        const result = await subRes.json();
        const urls = result?.data?.attributes?.urls || {};
        portalUrl =
          urls.customer_portal ||
          urls.customer_portal_update_subscription ||
          urls.update_payment_method ||
          null;
      }
    }

    // Fall back to the customer-level portal
    if (!portalUrl && customerId) {
      const custRes = await fetch(
        `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
        { headers: lsHeaders },
      );
      if (!custRes.ok) {
        const text = await custRes.text().catch(() => '');
        console.error(`[Portal] Customer fetch failed (${custRes.status}):`, text);
      } else {
        const result = await custRes.json();
        portalUrl = result?.data?.attributes?.urls?.customer_portal || null;
      }
    }

    if (!portalUrl) {
      return NextResponse.json(
        { error: 'Billing portal is not available for this subscription yet. Please try again in a minute.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ portalUrl });
  } catch (error: any) {
    console.error('[Portal] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
