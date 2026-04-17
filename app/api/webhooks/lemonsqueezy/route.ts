import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { getPlanByVariantId, PLANS } from '@/lib/plans';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, EmailTemplateData, EmailTemplateType } from '@/lib/email-templates';
import {
  generateSubscriptionInvoicePdf,
  makeSubscriptionInvoiceNumber,
  SubscriptionInvoiceData,
} from '@/lib/subscription-invoice-pdf';

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

        const existingUserDoc = await adminDb.doc(`users/${userId}`).get();
        const existingSub = existingUserDoc.data()?.subscription || {};

        const periodStart = Timestamp.now();
        const periodEnd = attrs.renews_at ? Timestamp.fromDate(new Date(attrs.renews_at)) : null;
        const billingPeriod = getBillingPeriodFromVariant(plan, variantId);
        const effectivePrice = getEffectivePrice(plan, billingPeriod);

        await adminDb.doc(`users/${userId}`).update({
          subscription: {
            planId: plan.id,
            status: 'active',
            lemonSqueezyCustomerId: String(attrs.customer_id || ''),
            lemonSqueezySubscriptionId: String(payload.data?.id || ''),
            lemonSqueezyVariantId: variantId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAt: null,
            trialStartedAt: existingSub.trialStartedAt || null,
            trialEndsAt: null,
            billingPeriod,
            createdAt: existingSub.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        });

        const orderId = String(payload.data?.id || eventId);
        const invoiceNumber = makeSubscriptionInvoiceNumber(orderId);

        await addBillingEvent(userId, {
          type: 'subscription_created',
          description: `Subscribed to ${plan.name} plan`,
          amount: effectivePrice,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: attrs.urls?.customer_portal || null,
          invoiceNumber,
        });

        const user = await getUserInfo(userId);
        const attachments = user
          ? await buildInvoiceAttachment({
              invoiceNumber,
              issueDate: new Date(),
              paidDate: new Date(),
              billingPeriodStart: periodStart.toDate(),
              billingPeriodEnd: periodEnd?.toDate() ?? null,
              customerName: user.name,
              customerEmail: user.email,
              customerAddress: null,
              planName: plan.name,
              billingPeriod,
              subtotal: effectivePrice,
              tax: 0,
              total: effectivePrice,
              paymentMethod: attrs.card_brand
                ? `${capitalize(attrs.card_brand)} ending in ${attrs.card_last_four || '****'}`
                : null,
              lemonSqueezyOrderId: orderId,
            })
          : undefined;

        await notifyUser(
          userId,
          'subscription_started',
          {
            planName: plan.name,
            amount: `$${effectivePrice.toFixed(2)}`,
            billingPeriod,
            renewalDate: fmtDate(periodEnd?.toDate()),
            invoiceNumber,
          },
          {
            type: 'success',
            title: `Welcome to ${plan.name}!`,
            message: `Your ${plan.name} subscription is now active. Enjoy your upgraded features!`,
            category: 'subscription',
          },
          attachments,
        );
        break;
      }

      case 'subscription_updated': {
        const variantId = String(attrs.variant_id);
        const plan = getPlanByVariantId(variantId);
        const status = mapLSStatus(attrs.status);

        const prevSnap = await adminDb.doc(`users/${userId}`).get();
        const prevPlanId = prevSnap.data()?.subscription?.planId;

        const updateData: Record<string, any> = {
          'subscription.status': status,
          'subscription.updatedAt': Timestamp.now(),
          'subscription.lemonSqueezySubscriptionId': String(payload.data?.id || ''),
          'subscription.lemonSqueezyCustomerId': String(attrs.customer_id || ''),
        };

        if (plan) {
          updateData['subscription.planId'] = plan.id;
          updateData['subscription.lemonSqueezyVariantId'] = variantId;
          updateData['subscription.billingPeriod'] = getBillingPeriodFromVariant(plan, variantId);
        }

        if (attrs.renews_at) {
          updateData['subscription.currentPeriodEnd'] = Timestamp.fromDate(new Date(attrs.renews_at));
        }

        if (status === 'active') {
          updateData['subscription.trialEndsAt'] = null;
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

        // Only send plan_changed email if plan actually changed
        if (plan && prevPlanId && prevPlanId !== plan.id) {
          const prevPlan = PLANS[prevPlanId as keyof typeof PLANS];
          await notifyUser(
            userId,
            'plan_changed',
            {
              planName: plan.name,
              previousPlan: prevPlan?.name || 'Previous Plan',
            },
            {
              type: 'info',
              title: 'Plan Updated',
              message: `Your subscription has been updated to the ${plan.name} plan.`,
              category: 'subscription',
            },
          );
        }
        break;
      }

      case 'subscription_cancelled': {
        // In Lemon Squeezy, "cancelled" schedules end-of-period termination.
        // The subscription remains usable until `ends_at`.
        const endsAt = attrs.ends_at ? Timestamp.fromDate(new Date(attrs.ends_at)) : null;

        const snap = await adminDb.doc(`users/${userId}`).get();
        const planId = snap.data()?.subscription?.planId;
        const plan = PLANS[planId as keyof typeof PLANS];

        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'cancelled',
          'subscription.cancelAt': endsAt,
          'subscription.updatedAt': Timestamp.now(),
        });

        await addBillingEvent(userId, {
          type: 'subscription_cancelled',
          description: 'Subscription cancelled — access continues until period end',
          amount: 0,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        await notifyUser(
          userId,
          'subscription_cancelled_scheduled',
          {
            planName: plan?.name || 'your plan',
            endDate: fmtDate(endsAt?.toDate()),
          },
          {
            type: 'warning',
            title: 'Subscription Cancelled',
            message: `Your subscription will end on ${fmtDate(endsAt?.toDate())}. You can resume anytime before then.`,
            category: 'subscription',
          },
        );
        break;
      }

      case 'subscription_resumed': {
        const snap = await adminDb.doc(`users/${userId}`).get();
        const planId = snap.data()?.subscription?.planId;
        const plan = PLANS[planId as keyof typeof PLANS];

        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'active',
          'subscription.cancelAt': null,
          'subscription.updatedAt': Timestamp.now(),
        });

        await notifyUser(
          userId,
          'subscription_resumed',
          {
            planName: plan?.name || 'your plan',
            renewalDate: fmtDate(attrs.renews_at ? new Date(attrs.renews_at) : null),
          },
          {
            type: 'success',
            title: 'Subscription Resumed',
            message: 'Your subscription is active again. All features have been restored.',
            category: 'subscription',
          },
        );
        break;
      }

      case 'subscription_expired': {
        // Fires when a cancelled subscription's period actually ends
        const snap = await adminDb.doc(`users/${userId}`).get();
        const planId = snap.data()?.subscription?.planId;
        const plan = PLANS[planId as keyof typeof PLANS];

        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'ended',
          'subscription.planId': 'free',
          'subscription.updatedAt': Timestamp.now(),
        });

        await addBillingEvent(userId, {
          type: 'subscription_ended',
          description: 'Subscription period ended — moved to Free plan',
          amount: 0,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: null,
        });

        await notifyUser(
          userId,
          'subscription_ended',
          { planName: plan?.name || 'your plan' },
          {
            type: 'warning',
            title: 'Subscription Ended',
            message: 'Your subscription has ended. You can resubscribe anytime to restore full access.',
            category: 'subscription',
          },
        );
        break;
      }

      // Paused/unpaused still persisted for accuracy, but no emails are sent.
      case 'subscription_paused': {
        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'paused',
          'subscription.updatedAt': Timestamp.now(),
        });
        break;
      }

      case 'subscription_unpaused': {
        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'active',
          'subscription.updatedAt': Timestamp.now(),
        });
        break;
      }

      case 'subscription_payment_success': {
        const variantId = String(attrs.variant_id);
        const plan = getPlanByVariantId(variantId);

        const periodStart = Timestamp.now();
        const periodEnd = attrs.renews_at ? Timestamp.fromDate(new Date(attrs.renews_at)) : null;

        await adminDb.doc(`users/${userId}`).update({
          'subscription.status': 'active',
          'subscription.trialEndsAt': null,
          'subscription.currentPeriodStart': periodStart,
          'subscription.currentPeriodEnd': periodEnd,
          'subscription.updatedAt': Timestamp.now(),
        });

        const paymentAmount = parseFloat(attrs.total || '0') / 100;
        const orderId = String(attrs.order_id || payload.data?.id || eventId);
        const invoiceNumber = makeSubscriptionInvoiceNumber(orderId);

        await addBillingEvent(userId, {
          type: 'subscription_renewed',
          description: `${plan?.name || 'Subscription'} renewed`,
          amount: paymentAmount,
          currency: 'USD',
          lemonSqueezyEventId: eventId,
          invoiceUrl: attrs.urls?.invoice || null,
          invoiceNumber,
        });

        // Determine whether this is the first payment (created event already
        // sent the welcome email) or a renewal — skip email if we just emitted
        // subscription_created for the same order.
        const recentCreated = await adminDb
          .collection(`users/${userId}/billingHistory`)
          .where('type', '==', 'subscription_created')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        const firstPayment = !recentCreated.empty &&
          (Date.now() - (recentCreated.docs[0].data().createdAt?.toMillis?.() || 0)) < 60_000;

        if (firstPayment) {
          // The 'subscription_started' email already went out — no double email.
          break;
        }

        const user = await getUserInfo(userId);
        const planName = plan?.name || 'Flowbooks';
        const billingPeriod: 'monthly' | 'yearly' = plan
          ? getBillingPeriodFromVariant(plan, variantId)
          : 'monthly';
        const attachments = user
          ? await buildInvoiceAttachment({
              invoiceNumber,
              issueDate: new Date(),
              paidDate: new Date(),
              billingPeriodStart: periodStart.toDate(),
              billingPeriodEnd: periodEnd?.toDate() ?? null,
              customerName: user.name,
              customerEmail: user.email,
              customerAddress: null,
              planName,
              billingPeriod,
              subtotal: paymentAmount,
              tax: 0,
              total: paymentAmount,
              paymentMethod: attrs.card_brand
                ? `${capitalize(attrs.card_brand)} ending in ${attrs.card_last_four || '****'}`
                : null,
              lemonSqueezyOrderId: orderId,
            })
          : undefined;

        await notifyUser(
          userId,
          'subscription_renewed',
          {
            planName,
            amount: `$${paymentAmount.toFixed(2)}`,
            billingPeriod,
            renewalDate: fmtDate(periodEnd?.toDate()),
            invoiceNumber,
            paymentMethod: attrs.card_brand
              ? `${capitalize(attrs.card_brand)} ending in ${attrs.card_last_four || '****'}`
              : undefined,
          },
          {
            type: 'success',
            title: 'Payment Received',
            message: `Your payment of $${paymentAmount.toFixed(2)} has been processed successfully.`,
            category: 'subscription',
          },
          attachments,
        );
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

        const snap = await adminDb.doc(`users/${userId}`).get();
        const planId = snap.data()?.subscription?.planId;
        const plan = PLANS[planId as keyof typeof PLANS];

        await notifyUser(
          userId,
          'subscription_payment_failed',
          {
            planName: plan?.name || 'your plan',
            failureReason: attrs.status_formatted || 'the card on file was declined',
            updatePaymentUrl: attrs.urls?.update_payment_method || 'https://flowbooks.app/settings/billing',
          },
          {
            type: 'warning',
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method to continue your service.',
            category: 'subscription',
          },
        );
        break;
      }

      // ── Order Events ──
      case 'order_created': {
        console.log(`[LS Webhook] order_created for user ${userId} (logged only — subscription_created handles activation)`);
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

        const snap = await adminDb.doc(`users/${userId}`).get();
        const planId = snap.data()?.subscription?.planId;
        const plan = PLANS[planId as keyof typeof PLANS];

        await notifyUser(
          userId,
          'subscription_refunded',
          {
            planName: plan?.name || 'your plan',
            refundAmount: `$${refundAmount.toFixed(2)}`,
          },
          {
            type: 'info',
            title: 'Refund Processed',
            message: `A refund of $${refundAmount.toFixed(2)} has been processed to your account.`,
            category: 'subscription',
          },
        );
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

/** Determine whether a given variant id corresponds to monthly or yearly billing. */
function getBillingPeriodFromVariant(
  plan: { lemonSqueezyVariantId?: string; yearlyLemonSqueezyVariantId?: string },
  variantId: string,
): 'monthly' | 'yearly' {
  return plan.yearlyLemonSqueezyVariantId && plan.yearlyLemonSqueezyVariantId === variantId
    ? 'yearly'
    : 'monthly';
}

function getEffectivePrice(
  plan: { price: number; yearlyPrice?: number },
  period: 'monthly' | 'yearly',
): number {
  return period === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
}

function mapLSStatus(lsStatus: string): string {
  const map: Record<string, string> = {
    active: 'active',
    cancelled: 'cancelled',
    past_due: 'past_due',
    paused: 'paused',
    on_trial: 'trialing',
    expired: 'ended',
    unpaid: 'past_due',
  };
  return map[lsStatus] || 'active';
}

function fmtDate(d?: Date | null): string {
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

async function buildInvoiceAttachment(
  data: SubscriptionInvoiceData,
): Promise<Array<{ filename: string; content: Buffer; contentType?: string }> | undefined> {
  try {
    const pdf = generateSubscriptionInvoicePdf(data);
    return [
      {
        filename: `${data.invoiceNumber}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ];
  } catch (err) {
    console.error('[LS Webhook] Failed to generate invoice PDF:', err);
    return undefined;
  }
}

async function addBillingEvent(userId: string, event: {
  type: string;
  description: string;
  amount: number;
  currency: string;
  lemonSqueezyEventId: string;
  invoiceUrl: string | null;
  invoiceNumber?: string;
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
  templateType: EmailTemplateType,
  templateData: EmailTemplateData,
  notification: { type: 'info' | 'success' | 'warning'; title: string; message: string; category: string },
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>,
) {
  try {
    const user = await getUserInfo(userId);
    if (!user?.email) return;

    const { subject, html } = getEmailTemplate(templateType, { ...templateData, userName: user.name });
    await sendEmail(user.email, subject, html, attachments);

    await adminDb.collection(`users/${userId}/notifications`).add({
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error(`[LS Webhook] Failed to notify user ${userId}:`, err);
  }
}
