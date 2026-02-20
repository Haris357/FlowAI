import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { TOKEN_PACKS } from '@/lib/plans';
import type { TokenPackId } from '@/types/subscription';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { packId, userId } = await request.json();

    if (!packId || !userId) {
      return NextResponse.json({ error: 'packId and userId are required' }, { status: 400 });
    }

    const pack = TOKEN_PACKS.find(p => p.id === packId as TokenPackId);
    if (!pack || !pack.lemonSqueezyVariantId) {
      return NextResponse.json({ error: 'Invalid token pack' }, { status: 400 });
    }

    // Verify user has a paid plan (token purchases require Pro or Max)
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (!userData?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planId = userData.subscription?.planId || 'free';
    if (planId === 'free') {
      return NextResponse.json({ error: 'Token packs require a Pro or Max subscription' }, { status: 403 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json({ error: 'Lemon Squeezy not configured' }, { status: 500 });
    }

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
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?token_purchase=true`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId },
            },
            variant: {
              data: { type: 'variants', id: pack.lemonSqueezyVariantId },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Token Pack] Lemon Squeezy error:', err);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    const result = await response.json();
    const checkoutUrl = result.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error('[Token Pack] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
