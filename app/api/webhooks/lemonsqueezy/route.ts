import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { getPlanByVariantId, getTokenPackByVariantId } from '@/lib/plans';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';

initAdmin();
const adminDb = getFirestore();

// ==========================================
// WEBHOOK SIGNATURE VERIFICATION
// ==========================================

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[LS Webhook] No LEMON_SQUEEZY_WEBHOOK_SECRET configured');
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// ==========================================
// HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';

    if (!verifySignature(rawBody, signature)) {
      console.error('[LS Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id;

    if (!userId) {
      console.error('[LS Webhook] No user_id in custom_data');
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log(`[LS Webhook] Event: ${eventName}, User: ${userId}`);

    const attrs = payload.data?.attributes || {};
    const eventId = payload.meta?.event_id || `${eventName}_${Date.now()}`;

    // Idempotency check
    const existingEvent = await adminDb
      .collection(`users/${userId}/billingHistory`)
      .where('lemonSqueezyEventId', '==', eventId)
      .limit(1)
      .get();

    if (!existingEvent.empty) {
      console.log(`[LS Webhook] Duplicate event ${eventId}, skipping`);
      return NextResponse.json({ received: true });
    }

    switch (eventName) {
      // ── Subscription Events ──
      case 'subscription_created': {
        const variantId = String(attrs.variant_id);
        const plan = getPlanByVariantId(variantId);
        if (!plan) {
          console.error(`[LS Webhook] Unknown variant: ${variantId}`);
          break;
        }

        await adminDb.doc(`users/${userId}`).update({
          subscription: {
            planId: plan.id,
            status: 'active',
            lemonSqueezyCustomerId: String(attrs.customer_id || ''),
            lemonSqueezySubscriptionId: String(payload.data?.id || ''),
            lemonSqueezyVariantId: variantId,
            currentPeriodStart: Timestamp.now(),
            currentPeriodEnd: attrs.renews_at ? Timestamp.fromDate(new Date(attrs.renews_at)) : null,
            cancelAt: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        });

        await addBillingEvent(userId, {
          type: 'subscription_created',
          description: `Subscribed to ${plan.name} plan`,
          amount: plan.price,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: attrs.urls?.customer_portal || null,
        });

        // Send subscription confirmation email + payment receipt
        notifyUser(userId, 'payment_receipt', {
          amount: `$${plan.price.toFixed(2)}`,
          planName: plan.name,
          invoiceId: eventId,
        }, {
          type: 'success',
          title: `Welcome to ${plan.name}!`,
          message: `Your ${plan.name} subscription is now active. Enjoy your upgraded features!`,
          category: 'subscription',
        });
        break;
      }

      case 'subscription_updated': {
        const variantId = String(attrs.variant_id);
        const plan = getPlanByVariantId(variantId);
        const status = mapLSStatus(attrs.status);

        const updateData: Record<string, any> = {
          'subscription.status': status,
          'subscription.updatedAt': Timestamp.now(),
        };

        if (plan) {
          updateData['subscription.planId'] = plan.id;
          updateData['subscription.lemonSqueezyVariantId'] = variantId;
        }

        if (attrs.renews_at) {
          updateData['subscription.currentPeriodEnd'] = Timestamp.fromDate(new Date(attrs.renews_at));
        }

        await adminDb.doc(`users/${userId}`).update(updateData);

        await addBillingEvent(userId, {
          type: 'subscription_updated',
          description: `Subscription updated${plan ? ` to ${plan.name}` : ''}`,
          amount: plan?.price || 0,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        // Send plan change email if plan changed
        if (plan) {
          notifyUser(userId, 'plan_changed', {
            planName: plan.name,
            previousPlan: 'Previous Plan',
          }, {
            type: 'info',
            title: 'Plan Updated',
            message: `Your subscription has been updated to the ${plan.name} plan.`,
            category: 'subscription',
          });
        }
        break;
      }

      case 'subscription_cancelled': {
        const endsAt = attrs.ends_at ? Timestamp.fromDate(new Date(attrs.ends_at)) : null;

        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'cancelled',
          'subscription.cancelAt': endsAt,
          'subscription.updatedAt': Timestamp.now(),
        });

        await addBillingEvent(userId, {
          type: 'subscription_cancelled',
          description: 'Subscription cancelled',
          amount: 0,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        // Send cancellation email
        notifyUser(userId, 'subscription_cancelled', {
          planName: 'your plan',
        }, {
          type: 'warning',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. You can resubscribe anytime from your billing settings.',
          category: 'subscription',
        });
        break;
      }

      case 'subscription_resumed': {
        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'active',
          'subscription.cancelAt': null,
          'subscription.updatedAt': Timestamp.now(),
        });

        // Send resumption notification
        notifyUser(userId, 'custom', {
          customSubject: 'Your Flowbooks subscription has been resumed',
          customMessage: 'Great news! Your subscription is active again. All premium features have been restored. Thank you for continuing with Flowbooks!',
        }, {
          type: 'success',
          title: 'Subscription Resumed',
          message: 'Your subscription is active again. All features have been restored.',
          category: 'subscription',
        });
        break;
      }

      case 'subscription_payment_success': {
        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'active',
          'subscription.currentPeriodStart': Timestamp.now(),
          'subscription.currentPeriodEnd': attrs.renews_at
            ? Timestamp.fromDate(new Date(attrs.renews_at))
            : null,
          'subscription.updatedAt': Timestamp.now(),
        });

        const paymentAmount = parseFloat(attrs.total || '0') / 100;

        await addBillingEvent(userId, {
          type: 'subscription_renewed',
          description: 'Subscription payment successful',
          amount: paymentAmount,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: attrs.urls?.invoice || null,
        });

        // Send payment receipt email
        notifyUser(userId, 'payment_receipt', {
          amount: `$${paymentAmount.toFixed(2)}`,
          planName: 'Flowbooks',
          invoiceId: eventId,
        }, {
          type: 'success',
          title: 'Payment Received',
          message: `Your payment of $${paymentAmount.toFixed(2)} has been processed successfully.`,
          category: 'subscription',
        });
        break;
      }

      case 'subscription_payment_failed': {
        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'past_due',
          'subscription.updatedAt': Timestamp.now(),
        });

        await addBillingEvent(userId, {
          type: 'payment_failed',
          description: 'Payment failed',
          amount: 0,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        // Send payment failed warning email
        notifyUser(userId, 'account_warning', {
          warningType: 'Payment Failed',
          warningMessage: 'Your latest subscription payment could not be processed. Please update your payment method to avoid service interruption. Visit your billing settings to resolve this issue.',
        }, {
          type: 'warning',
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method to continue your service.',
          category: 'subscription',
        });
        break;
      }

      // ── Order Events (Token Packs) ──
      case 'order_created': {
        const variantId = String(attrs.first_order_item?.variant_id || '');
        const pack = getTokenPackByVariantId(variantId);
        if (!pack) {
          console.log(`[LS Webhook] order_created for non-token-pack variant: ${variantId}`);
          break;
        }

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await adminDb.collection(`users/${userId}/tokenPurchases`).add({
          lemonSqueezyOrderId: String(payload.data?.id || ''),
          packId: pack.id,
          tokensAmount: pack.tokens,
          tokensRemaining: pack.tokens,
          price: pack.price,
          status: 'completed',
          purchasedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        // Add bonus tokens to current usage period
        const period = getCurrentPeriod();
        const usageRef = adminDb.doc(`users/${userId}/usage/${period}`);
        const usageSnap = await usageRef.get();
        if (usageSnap.exists) {
          await usageRef.update({
            bonusTokens: FieldValue.increment(pack.tokens),
            updatedAt: Timestamp.now(),
          });
        }

        await addBillingEvent(userId, {
          type: 'token_purchase',
          description: `Purchased ${pack.name} (${(pack.tokens / 1000).toFixed(0)}K tokens)`,
          amount: pack.price,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: attrs.urls?.receipt || null,
        });

        // Send token pack receipt email
        notifyUser(userId, 'tokens_granted', {
          tokenAmount: pack.tokens,
        }, {
          type: 'success',
          title: 'Token Pack Purchased',
          message: `${(pack.tokens / 1000).toFixed(0)}K tokens have been added to your account.`,
          category: 'subscription',
        });
        break;
      }

      case 'order_refunded': {
        const refundAmount = parseFloat(attrs.total || '0') / 100;

        await addBillingEvent(userId, {
          type: 'refund',
          description: 'Order refunded',
          amount: -refundAmount,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        // Send refund notification email
        notifyUser(userId, 'custom', {
          customSubject: 'Refund Processed — Flowbooks',
          customMessage: `A refund of $${refundAmount.toFixed(2)} has been processed for your account. Please allow 3–5 business days for the amount to appear in your payment method.\n\nIf you have any questions about this refund, please contact our support team.`,
        }, {
          type: 'info',
          title: 'Refund Processed',
          message: `A refund of $${refundAmount.toFixed(2)} has been processed to your account.`,
          category: 'subscription',
        });
        break;
      }

      default:
        console.log(`[LS Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[LS Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ==========================================
// HELPERS
// ==========================================

function mapLSStatus(lsStatus: string): string {
  const map: Record<string, string> = {
    active: 'active',
    cancelled: 'cancelled',
    past_due: 'past_due',
    paused: 'paused',
    on_trial: 'trialing',
    expired: 'cancelled',
    unpaid: 'past_due',
  };
  return map[lsStatus] || 'active';
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function addBillingEvent(userId: string, event: {
  type: string;
  description: string;
  amount: number;
  currency: string;
  lemonSqueezyEventId: string;
  invoiceUrl: string | null;
}) {
  await adminDb.collection(`users/${userId}/billingHistory`).add({
    ...event,
    createdAt: Timestamp.now(),
  });
}

/** Get user email and name from Firestore (for sending transactional emails) */
async function getUserInfo(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const snap = await adminDb.doc(`users/${userId}`).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
      email: data.email || '',
      name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
    };
  } catch {
    return null;
  }
}

/** Send an email + in-app notification (non-blocking, won't fail the webhook) */
async function notifyUser(
  userId: string,
  templateType: Parameters<typeof getEmailTemplate>[0],
  templateData: Parameters<typeof getEmailTemplate>[1],
  notification: { type: 'info' | 'success' | 'warning'; title: string; message: string; category: string },
) {
  try {
    const user = await getUserInfo(userId);
    if (!user?.email) return;

    const { subject, html } = getEmailTemplate(templateType, { ...templateData, userName: user.name });
    await sendEmail(user.email, subject, html);

    await adminDb.collection(`users/${userId}/notifications`).add({
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error(`[LS Webhook] Failed to notify user ${userId}:`, err);
  }
}
