import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import {
  generateSubscriptionInvoicePdf,
  makeSubscriptionInvoiceNumber,
} from '@/lib/subscription-invoice-pdf';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/types/subscription';

initAdmin();
const adminDb = getFirestore();

/**
 * GET /api/subscription/invoice/[eventId]?userId=...
 *
 * Regenerates and returns the PDF invoice for a specific billing event.
 * Used by the billing page to let users download receipts on demand.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId || !eventId) {
      return NextResponse.json({ error: 'userId and eventId are required' }, { status: 400 });
    }

    const eventSnap = await adminDb.doc(`users/${userId}/billingHistory/${eventId}`).get();
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const event = eventSnap.data()!;

    // Only subscription-payment events have downloadable invoices
    if (!['subscription_created', 'subscription_renewed'].includes(event.type)) {
      return NextResponse.json({ error: 'No invoice available for this event' }, { status: 400 });
    }

    const userSnap = await adminDb.doc(`users/${userId}`).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data()!;
    const sub = userData.subscription || {};
    const plan = PLANS[(sub.planId as PlanId) || 'pro'];
    const planName = plan?.name || 'Flowbooks';
    const billingPeriod: 'monthly' | 'yearly' = sub.billingPeriod === 'yearly' ? 'yearly' : 'monthly';

    const paidAt: Date = event.createdAt?.toDate?.() || new Date();
    const amount: number = typeof event.amount === 'number' ? event.amount : 0;
    const invoiceNumber: string =
      event.invoiceNumber || makeSubscriptionInvoiceNumber(event.lemonSqueezyEventId || eventId, paidAt);

    const periodStart: Date | null = sub.currentPeriodStart?.toDate?.() || null;
    const periodEnd: Date | null = sub.currentPeriodEnd?.toDate?.() || null;

    const pdf = generateSubscriptionInvoicePdf({
      invoiceNumber,
      issueDate: paidAt,
      paidDate: paidAt,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      customerName:
        userData.name || userData.displayName || userData.email?.split('@')[0] || 'Customer',
      customerEmail: userData.email || '',
      customerAddress: null,
      planName,
      billingPeriod,
      subtotal: amount,
      tax: 0,
      total: amount,
      paymentMethod: null,
      lemonSqueezyOrderId: event.lemonSqueezyEventId || null,
    });

    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('[Invoice Download] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
