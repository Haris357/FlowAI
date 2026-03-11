import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPlan, DEFAULT_SUBSCRIPTION, getCurrentWeekStart, getNextWeekStart } from '@/lib/plans';
import type { UserSubscription, UsageState, BillingEvent, PlanId } from '@/types/subscription';

// ==========================================
// SUBSCRIPTION
// ==========================================

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.subscription) {
        return data.subscription as UserSubscription;
      }
    }

    // Return default free subscription if none exists
    return {
      ...DEFAULT_SUBSCRIPTION,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    } as UserSubscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return {
      ...DEFAULT_SUBSCRIPTION,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    } as UserSubscription;
  }
}

export async function updateUserSubscription(
  userId: string,
  data: Partial<UserSubscription>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      updateData[`subscription.${key}`] = value;
    }
    updateData['subscription.updatedAt'] = serverTimestamp();
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// ==========================================
// USAGE STATE (Session + Weekly)
// ==========================================

export async function getUsageState(userId: string): Promise<UsageState | null> {
  try {
    const usageRef = doc(db, 'users', userId, 'usage', 'current');
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      return usageSnap.data() as UsageState;
    }
    return null;
  } catch (error) {
    console.error('Error fetching usage state:', error);
    return null;
  }
}

export interface RemainingUsage {
  session: {
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    resetsAt: number; // epoch ms
  };
  weekly: {
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    resetsAt: string; // "YYYY-MM-DD" (next Monday)
  };
  bonusTokens: number;
  blockedBy: 'none' | 'session' | 'weekly';
}

export async function getRemainingUsage(userId: string, planId: PlanId): Promise<RemainingUsage> {
  const plan = getPlan(planId);
  const sessionDurationMs = plan.sessionDurationHours * 60 * 60 * 1000;
  const currentWeekStart = getCurrentWeekStart();
  const nextWeekStart = getNextWeekStart();

  const usage = await getUsageState(userId);

  if (!usage) {
    return {
      session: { used: 0, limit: plan.sessionTokenLimit, remaining: plan.sessionTokenLimit, percentUsed: 0, resetsAt: Date.now() + sessionDurationMs },
      weekly: { used: 0, limit: plan.weeklyTokenLimit, remaining: plan.weeklyTokenLimit, percentUsed: 0, resetsAt: nextWeekStart },
      bonusTokens: 0,
      blockedBy: 'none',
    };
  }

  // Client-side auto-reset logic (mirrors server)
  let sessionUsed = usage.sessionTokensUsed || 0;
  let weeklyUsed = usage.weeklyTokensUsed || 0;
  let sessionStartMs = usage.sessionStart?.toMillis?.()
    || (usage.sessionStart as any)?._seconds * 1000
    || (usage.sessionStart as any)?.seconds * 1000
    || Date.now();

  // Auto-reset session if expired
  if (Date.now() > sessionStartMs + sessionDurationMs) {
    sessionUsed = 0;
    sessionStartMs = Date.now();
  }

  // Auto-reset weekly if new week
  if ((usage.weekStart || '') !== currentWeekStart) {
    weeklyUsed = 0;
  }

  const sessionRemaining = Math.max(0, plan.sessionTokenLimit - sessionUsed);
  const weeklyBase = Math.max(0, plan.weeklyTokenLimit - weeklyUsed);
  const bonus = usage.bonusTokens || 0;
  const weeklyRemaining = weeklyBase + bonus;

  const sessionPercentUsed = plan.sessionTokenLimit > 0
    ? Math.min(100, (sessionUsed / plan.sessionTokenLimit) * 100)
    : 0;
  const weeklyPercentUsed = plan.weeklyTokenLimit > 0
    ? Math.min(100, (weeklyUsed / plan.weeklyTokenLimit) * 100)
    : 0;

  let blockedBy: 'none' | 'session' | 'weekly' = 'none';
  if (sessionRemaining <= 0) blockedBy = 'session';
  else if (weeklyRemaining <= 0) blockedBy = 'weekly';

  return {
    session: { used: sessionUsed, limit: plan.sessionTokenLimit, remaining: sessionRemaining, percentUsed: sessionPercentUsed, resetsAt: sessionStartMs + sessionDurationMs },
    weekly: { used: weeklyUsed, limit: plan.weeklyTokenLimit, remaining: weeklyRemaining, percentUsed: weeklyPercentUsed, resetsAt: nextWeekStart },
    bonusTokens: bonus,
    blockedBy,
  };
}

// ==========================================
// BILLING HISTORY
// ==========================================

export async function getBillingHistory(userId: string, maxItems = 50): Promise<BillingEvent[]> {
  try {
    const historyRef = collection(db, 'users', userId, 'billingHistory');
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as BillingEvent);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}
