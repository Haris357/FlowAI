import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/types/subscription';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, billingPeriod } = await request.json();
    const isYearly = billingPeriod === 'yearly';

    if (!planId || !userId) {
      return NextResponse.json({ error: 'planId and userId are required' }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const monthlyVariantIdMap: Record<string, string | undefined> = {
      pro: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID,
      max: process.env.LEMON_SQUEEZY_MAX_VARIANT_ID,
    };
    const yearlyVariantIdMap: Record<string, string | undefined> = {
      pro: process.env.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID,
      max: process.env.LEMON_SQUEEZY_MAX_YEARLY_VARIANT_ID,
    };
    const variantId = isYearly
      ? (yearlyVariantIdMap[planId] || plan.yearlyLemonSqueezyVariantId)
      : (monthlyVariantIdMap[planId] || plan.lemonSqueezyVariantId);

    if (!variantId) {
      console.error(`[Checkout] No variant ID for plan: ${planId}`);
      return NextResponse.json({ error: 'Plan variant not configured' }, { status: 500 });
    }

    // Get user email from Firestore
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (!userData?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json({ error: 'Lemon Squeezy not configured' }, { status: 500 });
    }

    // Create checkout via Lemon Squeezy API
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userData.email,
              name: userData.name || '',
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: `${process.env.APP_URL || 'http://localhost:3000'}/settings/billing?success=true`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Checkout] Lemon Squeezy error (${response.status}):`, err);
      console.error(`[Checkout] Used variantId: ${variantId}, storeId: ${storeId}`);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    const result = await response.json();
    const checkoutUrl = result.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
