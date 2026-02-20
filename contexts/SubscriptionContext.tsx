'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getUserSubscription, getRemainingTokens, getUsagePeriod } from '@/services/subscription';
import { getPlan, DEFAULT_SUBSCRIPTION, PLANS, isUnlimited } from '@/lib/plans';
import type { UserSubscription, UsagePeriod, PlanDefinition, PlanId, PlanLimitCheck } from '@/types/subscription';

// ==========================================
// CONTEXT TYPE
// ==========================================

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: PlanDefinition;
  usage: UsagePeriod | null;
  loading: boolean;
  // Computed
  tokensRemaining: number;
  tokenPercentUsed: number;
  isOverLimit: boolean;
  // Actions
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  checkLimit: (limitType: string, currentCount?: number) => PlanLimitCheck;
  // Upgrade prompt
  upgradeReason: string | null;
  showUpgradeModal: (reason: string) => void;
  dismissUpgradeModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  plan: PLANS.free,
  usage: null,
  loading: true,
  tokensRemaining: 0,
  tokenPercentUsed: 0,
  isOverLimit: false,
  refreshSubscription: async () => {},
  refreshUsage: async () => {},
  checkLimit: () => ({ allowed: true }),
  upgradeReason: null,
  showUpgradeModal: () => {},
  dismissUpgradeModal: () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

// ==========================================
// PROVIDER
// ==========================================

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsagePeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const [tokenPercentUsed, setTokenPercentUsed] = useState(0);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const planId: PlanId = subscription?.planId || 'free';
  const plan = getPlan(planId);
  const isOverLimit = tokensRemaining <= 0;

  // ── Fetch subscription data ──
  const refreshSubscription = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const sub = await getUserSubscription(user.uid);
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, [user?.uid]);

  // ── Fetch usage data ──
  const refreshUsage = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const currentPlanId = subscription?.planId || 'free';
      const remaining = await getRemainingTokens(user.uid, currentPlanId);
      setTokensRemaining(remaining.total);
      setTokenPercentUsed(remaining.percentUsed);

      const usagePeriod = await getUsagePeriod(user.uid);
      setUsage(usagePeriod);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, [user?.uid, subscription?.planId]);

  // ── Initial load ──
  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      setLoading(true);
      await refreshSubscription();
      setLoading(false);
    };
    load();
  }, [user?.uid, refreshSubscription]);

  // ── Load usage after subscription is available ──
  useEffect(() => {
    if (subscription) {
      refreshUsage();
    }
  }, [subscription, refreshUsage]);

  // ── Check plan limits ──
  const checkLimit = useCallback((limitType: string, currentCount?: number): PlanLimitCheck => {
    const count = currentCount || 0;

    switch (limitType) {
      case 'companies': {
        if (isUnlimited(plan.maxCompanies)) return { allowed: true };
        const allowed = count < plan.maxCompanies;
        return {
          allowed,
          reason: allowed ? undefined : `Free plan allows ${plan.maxCompanies} company. Upgrade for more.`,
          currentUsage: count,
          limit: plan.maxCompanies,
          upgradeRequired: planId === 'free' ? 'pro' : 'max',
        };
      }
      case 'collaborators': {
        if (isUnlimited(plan.maxCollaboratorsPerCompany)) return { allowed: true };
        const allowed = count < plan.maxCollaboratorsPerCompany;
        return {
          allowed,
          reason: allowed ? undefined : `Your plan allows ${plan.maxCollaboratorsPerCompany} collaborators. Upgrade for more.`,
          currentUsage: count,
          limit: plan.maxCollaboratorsPerCompany,
          upgradeRequired: planId === 'free' ? 'pro' : 'max',
        };
      }
      case 'customers': {
        if (isUnlimited(plan.maxCustomers)) return { allowed: true };
        const allowed = count < plan.maxCustomers;
        return {
          allowed,
          reason: allowed ? undefined : `Free plan allows ${plan.maxCustomers} customers. Upgrade for unlimited.`,
          currentUsage: count,
          limit: plan.maxCustomers,
          upgradeRequired: 'pro',
        };
      }
      case 'vendors': {
        if (isUnlimited(plan.maxVendors)) return { allowed: true };
        const allowed = count < plan.maxVendors;
        return {
          allowed,
          reason: allowed ? undefined : `Free plan allows ${plan.maxVendors} vendors. Upgrade for unlimited.`,
          currentUsage: count,
          limit: plan.maxVendors,
          upgradeRequired: 'pro',
        };
      }
      case 'invoices': {
        if (isUnlimited(plan.maxInvoicesPerMonth)) return { allowed: true };
        const allowed = count < plan.maxInvoicesPerMonth;
        return {
          allowed,
          reason: allowed ? undefined : `Free plan allows ${plan.maxInvoicesPerMonth} invoices/month. Upgrade for unlimited.`,
          currentUsage: count,
          limit: plan.maxInvoicesPerMonth,
          upgradeRequired: 'pro',
        };
      }
      case 'tokens': {
        const allowed = tokensRemaining > 0;
        return {
          allowed,
          reason: allowed ? undefined : 'You have used all your AI tokens this month.',
          currentUsage: usage?.tokensUsed || 0,
          limit: plan.tokenAllocation,
          upgradeRequired: planId === 'free' ? 'pro' : planId === 'pro' ? 'max' : undefined,
        };
      }
      case 'payroll': {
        return {
          allowed: plan.features.payroll,
          reason: plan.features.payroll ? undefined : 'Payroll requires a Pro or Max plan.',
          upgradeRequired: 'pro',
        };
      }
      case 'reports': {
        return {
          allowed: plan.features.allReports,
          reason: plan.features.allReports ? undefined : 'Advanced reports require a Pro or Max plan.',
          upgradeRequired: 'pro',
        };
      }
      default:
        return { allowed: true };
    }
  }, [plan, planId, tokensRemaining, usage]);

  const showUpgradeModal = useCallback((reason: string) => {
    setUpgradeReason(reason);
  }, []);

  const dismissUpgradeModal = useCallback(() => {
    setUpgradeReason(null);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plan,
        usage,
        loading,
        tokensRemaining,
        tokenPercentUsed,
        isOverLimit,
        refreshSubscription,
        refreshUsage,
        checkLimit,
        upgradeReason,
        showUpgradeModal,
        dismissUpgradeModal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
