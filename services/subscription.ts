import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPlan, DEFAULT_SUBSCRIPTION } from '@/lib/plans';
import type { UserSubscription, UsagePeriod, TokenPurchase, BillingEvent, PlanId } from '@/types/subscription';

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
// USAGE TRACKING
// ==========================================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getUsagePeriod(userId: string, period?: string): Promise<UsagePeriod | null> {
  try {
    const p = period || getCurrentPeriod();
    const usageRef = doc(db, 'users', userId, 'usage', p);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      return usageSnap.data() as UsagePeriod;
    }
    return null;
  } catch (error) {
    console.error('Error fetching usage period:', error);
    return null;
  }
}

export async function getOrCreateUsagePeriod(userId: string, planId: PlanId): Promise<UsagePeriod> {
  const period = getCurrentPeriod();
  const usageRef = doc(db, 'users', userId, 'usage', period);
  const usageSnap = await getDoc(usageRef);

  if (usageSnap.exists()) {
    return usageSnap.data() as UsagePeriod;
  }

  // Create new period with fresh allocation
  const plan = getPlan(planId);
  const newUsage: Record<string, any> = {
    userId,
    period,
    planId,
    tokenAllocation: plan.tokenAllocation,
    tokensUsed: 0,
    bonusTokens: 0,
    requestCount: 0,
    costAccumulated: 0,
    breakdown: {},
    resetAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Carry over unused bonus tokens from purchases
  const purchases = await getActiveTokenPurchases(userId);
  const totalBonus = purchases.reduce((sum, p) => sum + p.tokensRemaining, 0);
  newUsage.bonusTokens = totalBonus;

  await setDoc(usageRef, newUsage);
  return newUsage as UsagePeriod;
}

export async function getRemainingTokens(userId: string, planId: PlanId): Promise<{
  monthly: number;
  bonus: number;
  total: number;
  used: number;
  limit: number;
  percentUsed: number;
}> {
  const usage = await getOrCreateUsagePeriod(userId, planId);
  const monthlyRemaining = Math.max(0, usage.tokenAllocation - usage.tokensUsed);
  const bonus = usage.bonusTokens || 0;
  const total = monthlyRemaining + bonus;
  const percentUsed = usage.tokenAllocation > 0
    ? Math.min(100, (usage.tokensUsed / usage.tokenAllocation) * 100)
    : 0;

  return {
    monthly: monthlyRemaining,
    bonus,
    total,
    used: usage.tokensUsed,
    limit: usage.tokenAllocation,
    percentUsed,
  };
}

// ==========================================
// TOKEN PURCHASES
// ==========================================

export async function getActiveTokenPurchases(userId: string): Promise<TokenPurchase[]> {
  try {
    const purchasesRef = collection(db, 'users', userId, 'tokenPurchases');
    const q = query(purchasesRef, orderBy('purchasedAt', 'desc'));
    const snap = await getDocs(q);

    const now = new Date();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }) as TokenPurchase)
      .filter(p => p.status === 'completed' && p.tokensRemaining > 0 && (!p.expiresAt || (p.expiresAt as any).toDate() > now));
  } catch (error) {
    console.error('Error fetching token purchases:', error);
    return [];
  }
}

export async function getAllTokenPurchases(userId: string): Promise<TokenPurchase[]> {
  try {
    const purchasesRef = collection(db, 'users', userId, 'tokenPurchases');
    const q = query(purchasesRef, orderBy('purchasedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as TokenPurchase);
  } catch (error) {
    console.error('Error fetching token purchases:', error);
    return [];
  }
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
