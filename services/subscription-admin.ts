/**
 * Subscription & Usage Tracking (Server-Side Admin SDK)
 * For use in API routes only
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { getPlan, isUnlimited, DEFAULT_SUBSCRIPTION, getCurrentDay, getCurrentWeekStart, getNextWeekStart, TRIAL_DURATION_DAYS, TRIAL_PLAN, getTrialEndDate } from '@/lib/plans';
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

  // Lazily initialize trial subscription for users without one
  const trialEnd = getTrialEndDate(TRIAL_DURATION_DAYS);
  const defaultSub = {
    ...DEFAULT_SUBSCRIPTION,
    planId: TRIAL_PLAN,
    status: 'trialing' as const,
    trialStartedAt: Timestamp.now(),
    trialEndsAt: Timestamp.fromDate(trialEnd),
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
  if (subscription.status === 'active') {
    return subscription.planId;
  }

  // Trial: check if still within trial period
  if (subscription.status === 'trialing') {
    if (subscription.trialEndsAt) {
      const endMs = (subscription.trialEndsAt as any).toMillis?.()
        || (subscription.trialEndsAt as any)._seconds * 1000
        || (subscription.trialEndsAt as any).seconds * 1000
        || 0;
      if (Date.now() <= endMs) return subscription.planId;
    }
    // Trial expired → downgrade to free (locked out)
    return 'free';
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
// USAGE BUDGET CHECK (Session + Weekly)
// ==========================================

export interface UsageBudgetResult {
  canSend: boolean;
  blockedBy: 'none' | 'session' | 'weekly' | 'trial_expired';
  session: { used: number; limit: number; remaining: number; resetsAt: number };
  weekly: { used: number; limit: number; remaining: number; resetsAt: string };
  planId: PlanId;
  allowedModels: string[];
}

export async function checkUsageBudgetAdmin(userId: string): Promise<UsageBudgetResult> {
  const subscription = await getSubscriptionAdmin(userId);
  const effectivePlanId = getEffectivePlanId(subscription);
  const plan = getPlan(effectivePlanId);

  // Check if trial has expired (effective plan downgraded to free)
  if (subscription.status === 'trialing' && effectivePlanId === 'free') {
    const nextWeekStart = getNextWeekStart();
    return {
      canSend: false,
      blockedBy: 'trial_expired',
      session: { used: 0, limit: 0, remaining: 0, resetsAt: 0 },
      weekly: { used: 0, limit: 0, remaining: 0, resetsAt: nextWeekStart },
      planId: effectivePlanId,
      allowedModels: [],
    };
  }

  const usageRef = adminDb.doc(`users/${userId}/usage/current`);
  const usageSnap = await usageRef.get();

  const sessionDurationMs = plan.sessionDurationHours * 60 * 60 * 1000;
  const currentWeekStart = getCurrentWeekStart();
  const nextWeekStart = getNextWeekStart();

  if (!usageSnap.exists) {
    // No usage doc yet — full allocation
    return {
      canSend: true,
      blockedBy: 'none',
      session: { used: 0, limit: plan.sessionMessageLimit, remaining: plan.sessionMessageLimit, resetsAt: Date.now() + sessionDurationMs },
      weekly: { used: 0, limit: plan.weeklyMessageLimit, remaining: plan.weeklyMessageLimit, resetsAt: nextWeekStart },
      planId: effectivePlanId,
      allowedModels: plan.allowedModels,
    };
  }

  const data = usageSnap.data()!;
  let sessionUsed = data.sessionMessagesUsed || 0;
  let weeklyUsed = data.weeklyMessagesUsed || 0;
  let bonusMessages = data.bonusMessages || 0;
  let sessionStartMs = data.sessionStart?.toMillis?.() || data.sessionStart?._seconds * 1000 || Date.now();
  let needsUpdate = false;
  const updates: Record<string, any> = {};

  // Auto-reset session if expired
  if (Date.now() > sessionStartMs + sessionDurationMs) {
    sessionUsed = 0;
    sessionStartMs = Date.now();
    updates.sessionMessagesUsed = 0;
    updates.sessionStart = Timestamp.now();
    updates.sessionLimit = plan.sessionMessageLimit;
    updates.sessionDurationMs = sessionDurationMs;
    needsUpdate = true;
  }

  // Auto-reset weekly if new week
  const docWeekStart = data.weekStart || '';
  if (docWeekStart !== currentWeekStart) {
    weeklyUsed = 0;
    updates.weeklyMessagesUsed = 0;
    updates.weekStart = currentWeekStart;
    updates.weeklyLimit = plan.weeklyMessageLimit;
    needsUpdate = true;
  }

  // Apply updates if needed
  if (needsUpdate) {
    updates.planId = effectivePlanId;
    updates.updatedAt = Timestamp.now();
    await usageRef.update(updates);
  }

  const sessionRemaining = Math.max(0, plan.sessionMessageLimit - sessionUsed);
  const weeklyBase = Math.max(0, plan.weeklyMessageLimit - weeklyUsed);
  const weeklyRemaining = weeklyBase + bonusMessages;

  let blockedBy: 'none' | 'session' | 'weekly' = 'none';
  if (sessionRemaining <= 0) blockedBy = 'session';
  else if (weeklyRemaining <= 0) blockedBy = 'weekly';

  return {
    canSend: blockedBy === 'none',
    blockedBy,
    session: { used: sessionUsed, limit: plan.sessionMessageLimit, remaining: sessionRemaining, resetsAt: sessionStartMs + sessionDurationMs },
    weekly: { used: weeklyUsed, limit: plan.weeklyMessageLimit, remaining: weeklyRemaining, resetsAt: nextWeekStart },
    planId: effectivePlanId,
    allowedModels: plan.allowedModels,
  };
}

// ==========================================
// USAGE TRACKING
// ==========================================

/**
 * Track a single AI message usage (session + weekly).
 * Each AI response = 1 message. Internal token/cost tracking preserved for admin.
 */
export async function trackUsageAdmin(
  userId: string,
  tokensConsumed: number,
  model: string,
  cost: number
): Promise<{ sessionRemaining: number; weeklyRemaining: number }> {
  const subscription = await getSubscriptionAdmin(userId);
  const effectivePlanId = getEffectivePlanId(subscription);
  const plan = getPlan(effectivePlanId);

  const sessionDurationMs = plan.sessionDurationHours * 60 * 60 * 1000;
  const currentWeekStart = getCurrentWeekStart();
  const usageRef = adminDb.doc(`users/${userId}/usage/current`);
  const usageSnap = await usageRef.get();

  if (!usageSnap.exists) {
    // Create new usage doc with first message
    await usageRef.set({
      userId,
      planId: effectivePlanId,
      sessionStart: Timestamp.now(),
      sessionMessagesUsed: 1,
      sessionLimit: plan.sessionMessageLimit,
      sessionDurationMs,
      weekStart: currentWeekStart,
      weeklyMessagesUsed: 1,
      weeklyLimit: plan.weeklyMessageLimit,
      bonusMessages: 0,
      totalTokensConsumed: tokensConsumed,
      costAccumulated: cost,
      requestCount: 1,
      breakdown: {
        [model]: { input: 0, output: 0, total: tokensConsumed, requests: 1 },
      },
      updatedAt: Timestamp.now(),
    });

    return {
      sessionRemaining: Math.max(0, plan.sessionMessageLimit - 1),
      weeklyRemaining: Math.max(0, plan.weeklyMessageLimit - 1),
    };
  }

  const data = usageSnap.data()!;
  const updateFields: Record<string, any> = {
    sessionMessagesUsed: FieldValue.increment(1),
    weeklyMessagesUsed: FieldValue.increment(1),
    totalTokensConsumed: FieldValue.increment(tokensConsumed),
    costAccumulated: FieldValue.increment(cost),
    requestCount: FieldValue.increment(1),
    [`breakdown.${model}.total`]: FieldValue.increment(tokensConsumed),
    [`breakdown.${model}.requests`]: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  };

  // Check if weekly limit is exhausted — deduct from bonus instead
  const weeklyUsed = data.weeklyMessagesUsed || 0;
  const weeklyRemaining = Math.max(0, plan.weeklyMessageLimit - weeklyUsed);
  if (weeklyRemaining < 1 && (data.bonusMessages || 0) > 0) {
    updateFields.bonusMessages = FieldValue.increment(-1);
  }

  await usageRef.update(updateFields);

  const newSessionUsed = (data.sessionMessagesUsed || 0) + 1;
  const newWeeklyUsed = weeklyUsed + 1;
  const newBonus = Math.max(0, (data.bonusMessages || 0) - (weeklyRemaining < 1 ? 1 : 0));

  return {
    sessionRemaining: Math.max(0, plan.sessionMessageLimit - newSessionUsed),
    weeklyRemaining: Math.max(0, plan.weeklyMessageLimit - newWeeklyUsed) + newBonus,
  };
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
