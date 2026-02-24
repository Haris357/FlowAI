/**
 * Subscription & Usage Tracking (Server-Side Admin SDK)
 * For use in API routes only
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { getPlan, isUnlimited, DEFAULT_SUBSCRIPTION } from '@/lib/plans';
import type { PlanId, UserSubscription } from '@/types/subscription';

initAdmin();
const adminDb = getFirestore();

// ==========================================
// SUBSCRIPTION
// ==========================================

export async function getSubscriptionAdmin(userId: string): Promise<UserSubscription> {
  const userDoc = await adminDb.doc(`users/${userId}`).get();
  const data = userDoc.data();

  if (data?.subscription) {
    return data.subscription as UserSubscription;
  }

  // Lazily initialize free subscription for existing users
  const defaultSub = {
    ...DEFAULT_SUBSCRIPTION,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await adminDb.doc(`users/${userId}`).update({ subscription: defaultSub });
  return defaultSub as UserSubscription;
}

/**
 * Get the effective plan considering grace periods.
 * - cancelled: retain plan until currentPeriodEnd
 * - past_due: retain plan for 3 days, then downgrade
 */
export function getEffectivePlanId(subscription: UserSubscription): PlanId {
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return subscription.planId;
  }

  if (subscription.status === 'cancelled' && subscription.currentPeriodEnd) {
    const endDate = (subscription.currentPeriodEnd as any).toDate
      ? (subscription.currentPeriodEnd as any).toDate()
      : new Date(subscription.currentPeriodEnd as any);
    if (endDate > new Date()) return subscription.planId;
  }

  if (subscription.status === 'past_due' && subscription.updatedAt) {
    const updatedDate = (subscription.updatedAt as any).toDate
      ? (subscription.updatedAt as any).toDate()
      : new Date(subscription.updatedAt as any);
    const gracePeriod = 3 * 24 * 60 * 60 * 1000; // 3 days
    if (Date.now() - updatedDate.getTime() < gracePeriod) return subscription.planId;
  }

  return 'free';
}

// ==========================================
// TOKEN BUDGET CHECK
// ==========================================

export async function checkTokenBudgetAdmin(userId: string): Promise<{
  hasTokens: boolean;
  remaining: number;
  limit: number;
  planId: PlanId;
  allowedModels: string[];
}> {
  const subscription = await getSubscriptionAdmin(userId);
  const effectivePlanId = getEffectivePlanId(subscription);
  const plan = getPlan(effectivePlanId);

  const period = getCurrentPeriod();
  const usageRef = adminDb.doc(`users/${userId}/usage/${period}`);
  const usageSnap = await usageRef.get();

  let tokensUsed = 0;
  let bonusTokens = 0;

  if (usageSnap.exists) {
    const data = usageSnap.data()!;
    tokensUsed = data.tokensUsed || 0;
    bonusTokens = data.bonusTokens || 0;
  }

  const monthlyRemaining = Math.max(0, plan.tokenAllocation - tokensUsed);
  const totalRemaining = monthlyRemaining + bonusTokens;

  return {
    hasTokens: totalRemaining > 0,
    remaining: totalRemaining,
    limit: plan.tokenAllocation,
    planId: effectivePlanId,
    allowedModels: plan.allowedModels,
  };
}

// ==========================================
// USAGE TRACKING
// ==========================================

export async function trackTokenUsageAdmin(
  userId: string,
  tokensUsed: number,
  model: string,
  cost: number
): Promise<{ remaining: number }> {
  const subscription = await getSubscriptionAdmin(userId);
  const effectivePlanId = getEffectivePlanId(subscription);
  const plan = getPlan(effectivePlanId);

  const period = getCurrentPeriod();
  const usageRef = adminDb.doc(`users/${userId}/usage/${period}`);
  const usageSnap = await usageRef.get();

  if (!usageSnap.exists) {
    // Create new period doc
    const bonusTokens = await getTotalBonusTokens(userId);
    await usageRef.set({
      userId,
      period,
      planId: effectivePlanId,
      tokenAllocation: plan.tokenAllocation,
      tokensUsed: tokensUsed,
      bonusTokens,
      requestCount: 1,
      costAccumulated: cost,
      breakdown: {
        [model]: { input: 0, output: 0, total: tokensUsed, requests: 1 },
      },
      resetAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const remaining = Math.max(0, plan.tokenAllocation - tokensUsed) + bonusTokens;
    return { remaining };
  }

  // Atomically increment usage
  const currentData = usageSnap.data()!;
  const monthlyRemaining = Math.max(0, plan.tokenAllocation - (currentData.tokensUsed || 0));

  if (monthlyRemaining >= tokensUsed) {
    // Deduct from monthly allocation
    await usageRef.update({
      tokensUsed: FieldValue.increment(tokensUsed),
      requestCount: FieldValue.increment(1),
      costAccumulated: FieldValue.increment(cost),
      [`breakdown.${model}.total`]: FieldValue.increment(tokensUsed),
      [`breakdown.${model}.requests`]: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });
  } else {
    // Partially from monthly, partially from bonus
    const fromBonus = tokensUsed - monthlyRemaining;
    await usageRef.update({
      tokensUsed: FieldValue.increment(tokensUsed),
      bonusTokens: FieldValue.increment(-fromBonus),
      requestCount: FieldValue.increment(1),
      costAccumulated: FieldValue.increment(cost),
      [`breakdown.${model}.total`]: FieldValue.increment(tokensUsed),
      [`breakdown.${model}.requests`]: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });
  }

  const newUsed = (currentData.tokensUsed || 0) + tokensUsed;
  const newMonthlyRemaining = Math.max(0, plan.tokenAllocation - newUsed);
  const newBonus = Math.max(0, (currentData.bonusTokens || 0) - Math.max(0, tokensUsed - monthlyRemaining));

  return { remaining: newMonthlyRemaining + newBonus };
}

// ==========================================
// PLAN LIMIT CHECK
// ==========================================

/**
 * Server-side plan limit check for API routes.
 * Verifies the user's plan allows the requested action.
 */
export async function checkPlanLimitAdmin(
  userId: string,
  limitType: string,
  currentCount?: number
): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  planId: PlanId;
}> {
  const subscription = await getSubscriptionAdmin(userId);
  const effectivePlanId = getEffectivePlanId(subscription);
  const plan = getPlan(effectivePlanId);
  const count = currentCount ?? 0;

  const check = (value: number, name: string) => {
    if (isUnlimited(value)) return { allowed: true as const };
    const allowed = count < value;
    return {
      allowed,
      reason: allowed ? undefined : `${plan.name} plan limit reached for ${name} (${value}). Please upgrade.`,
      limit: value,
    };
  };

  let result: { allowed: boolean; reason?: string; limit?: number };

  switch (limitType) {
    case 'emailSends':
      result = check(plan.maxEmailSendsPerMonth, 'email sends per month');
      break;
    case 'companies':
      result = check(plan.maxCompanies, 'companies');
      break;
    case 'customers':
      result = check(plan.maxCustomers, 'customers');
      break;
    case 'vendors':
      result = check(plan.maxVendors, 'vendors');
      break;
    case 'invoices':
      result = check(plan.maxInvoicesPerMonth, 'invoices per month');
      break;
    case 'bankAccounts':
      result = check(plan.maxBankAccounts, 'bank accounts');
      break;
    case 'recurringTransactions':
      result = check(plan.maxRecurringTransactions, 'recurring transactions');
      break;
    default:
      result = { allowed: true };
  }

  return { ...result, planId: effectivePlanId };
}

/**
 * Count email sends for a company in the current month.
 */
export async function getEmailSendCountAdmin(companyId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sentInvoicesSnap = await adminDb
    .collection(`companies/${companyId}/invoices`)
    .where('sentAt', '>=', startOfMonth)
    .get();

  return sentInvoicesSnap.size;
}

// ==========================================
// HELPERS
// ==========================================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getTotalBonusTokens(userId: string): Promise<number> {
  const purchasesSnap = await adminDb
    .collection(`users/${userId}/tokenPurchases`)
    .where('status', '==', 'completed')
    .get();

  const now = new Date();
  let total = 0;
  purchasesSnap.forEach(doc => {
    const data = doc.data();
    const remaining = data.tokensRemaining || 0;
    const expiresAt = data.expiresAt?.toDate?.() || null;
    if (remaining > 0 && (!expiresAt || expiresAt > now)) {
      total += remaining;
    }
  });
  return total;
}
