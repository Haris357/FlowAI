'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { getUserSubscription, getRemainingUsage } from '@/services/subscription';
import { getPlan, getCurrentWeekStart, getNextWeekStart, formatDuration, DEFAULT_SUBSCRIPTION, PLANS } from '@/lib/plans';
import type { UserSubscription, UsageState, PlanDefinition, PlanId, PlanLimitCheck } from '@/types/subscription';

// ==========================================
// CONTEXT TYPE
// ==========================================

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: PlanDefinition;
  usage: UsageState | null;
  loading: boolean;
  // Session
  sessionRemaining: number;
  sessionPercentUsed: number;
  sessionResetsAt: number | null; // epoch ms
  sessionTimeLeft: string; // "4h 23m"
  // Weekly
  weeklyRemaining: number;
  weeklyPercentUsed: number;
  weeklyResetsAt: string | null; // "YYYY-MM-DD"
  // Combined
  isOverLimit: boolean;
  blockedBy: 'none' | 'session' | 'weekly';
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
  sessionRemaining: 0,
  sessionPercentUsed: 0,
  sessionResetsAt: null,
  sessionTimeLeft: '',
  weeklyRemaining: 0,
  weeklyPercentUsed: 0,
  weeklyResetsAt: null,
  isOverLimit: false,
  blockedBy: 'none',
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
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRemaining, setSessionRemaining] = useState(0);
  const [sessionPercentUsed, setSessionPercentUsed] = useState(0);
  const [sessionResetsAt, setSessionResetsAt] = useState<number | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('');
  const [weeklyRemaining, setWeeklyRemaining] = useState(0);
  const [weeklyPercentUsed, setWeeklyPercentUsed] = useState(0);
  const [weeklyResetsAt, setWeeklyResetsAt] = useState<string | null>(null);
  const [blockedBy, setBlockedBy] = useState<'none' | 'session' | 'weekly'>('none');
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const planId: PlanId = subscription?.planId || 'free';
  const plan = getPlan(planId);
  const isOverLimit = blockedBy !== 'none';

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

  // ── Compute remaining from usage snapshot ──
  const computeRemaining = useCallback((usageData: UsageState | null) => {
    const currentPlan = getPlan(subscription?.planId || 'free');
    const sessionDurationMs = currentPlan.sessionDurationHours * 60 * 60 * 1000;
    const currentWeekStart = getCurrentWeekStart();
    const nextWeekStart = getNextWeekStart();

    if (!usageData) {
      setSessionRemaining(currentPlan.sessionMessageLimit);
      setSessionPercentUsed(0);
      setSessionResetsAt(Date.now() + sessionDurationMs);
      setWeeklyRemaining(currentPlan.weeklyMessageLimit);
      setWeeklyPercentUsed(0);
      setWeeklyResetsAt(nextWeekStart);
      setBlockedBy('none');
      return;
    }

    let sessionUsed = usageData.sessionMessagesUsed || 0;
    let weeklyUsed = usageData.weeklyMessagesUsed || 0;
    let sessionStartMs = usageData.sessionStart?.toMillis?.()
      || (usageData.sessionStart as any)?.seconds * 1000
      || Date.now();

    // Client-side auto-reset
    if (Date.now() > sessionStartMs + sessionDurationMs) {
      sessionUsed = 0;
      sessionStartMs = Date.now();
    }
    if ((usageData.weekStart || '') !== currentWeekStart) {
      weeklyUsed = 0;
    }

    const sRemaining = Math.max(0, currentPlan.sessionMessageLimit - sessionUsed);
    const wBase = Math.max(0, currentPlan.weeklyMessageLimit - weeklyUsed);
    const bonus = usageData.bonusMessages || 0;
    const wRemaining = wBase + bonus;

    setSessionRemaining(sRemaining);
    setSessionPercentUsed(currentPlan.sessionMessageLimit > 0
      ? Math.min(100, (sessionUsed / currentPlan.sessionMessageLimit) * 100) : 0);
    setSessionResetsAt(sessionStartMs + sessionDurationMs);

    setWeeklyRemaining(wRemaining);
    setWeeklyPercentUsed(currentPlan.weeklyMessageLimit > 0
      ? Math.min(100, (weeklyUsed / currentPlan.weeklyMessageLimit) * 100) : 0);
    setWeeklyResetsAt(nextWeekStart);

    if (sRemaining <= 0) setBlockedBy('session');
    else if (wRemaining <= 0) setBlockedBy('weekly');
    else setBlockedBy('none');
  }, [subscription?.planId]);

  // ── Manual refresh ──
  const refreshUsage = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const currentPlanId = subscription?.planId || 'free';
      const remaining = await getRemainingUsage(user.uid, currentPlanId);
      setSessionRemaining(remaining.session.remaining);
      setSessionPercentUsed(remaining.session.percentUsed);
      setSessionResetsAt(remaining.session.resetsAt);
      setWeeklyRemaining(remaining.weekly.remaining);
      setWeeklyPercentUsed(remaining.weekly.percentUsed);
      setWeeklyResetsAt(remaining.weekly.resetsAt);
      setBlockedBy(remaining.blockedBy);
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

  // ── Real-time listener for usage/current ──
  useEffect(() => {
    if (!user?.uid || !subscription) return;

    const usageRef = doc(db, 'users', user.uid, 'usage', 'current');

    const unsubscribe = onSnapshot(usageRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UsageState;
        setUsage(data);
        computeRemaining(data);
      } else {
        setUsage(null);
        computeRemaining(null);
      }
    }, (err) => {
      console.error('Usage listener error:', err);
    });

    return () => unsubscribe();
  }, [user?.uid, subscription, computeRemaining]);

  // ── Update session countdown every 30s ──
  useEffect(() => {
    const update = () => {
      if (sessionResetsAt) {
        const ms = Math.max(0, sessionResetsAt - Date.now());
        setSessionTimeLeft(formatDuration(ms));
      } else {
        setSessionTimeLeft('');
      }
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [sessionResetsAt]);

  // ── Check plan limits ──
  const checkLimit = useCallback((limitType: string, currentCount?: number): PlanLimitCheck => {
    const count = currentCount || 0;

    switch (limitType) {
      case 'companies': {
        if (plan.maxCompanies === -1) return { allowed: true };
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
        if (plan.maxCollaboratorsPerCompany === -1) return { allowed: true };
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
        if (plan.maxCustomers === -1) return { allowed: true };
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
        if (plan.maxVendors === -1) return { allowed: true };
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
        if (plan.maxInvoicesPerMonth === -1) return { allowed: true };
        const allowed = count < plan.maxInvoicesPerMonth;
        return {
          allowed,
          reason: allowed ? undefined : `Free plan allows ${plan.maxInvoicesPerMonth} invoices/month. Upgrade for unlimited.`,
          currentUsage: count,
          limit: plan.maxInvoicesPerMonth,
          upgradeRequired: 'pro',
        };
      }
      case 'messages': {
        const allowed = !isOverLimit;
        const reason = blockedBy === 'session'
          ? `You've used all messages in this session. Resets in ${sessionTimeLeft}.`
          : blockedBy === 'weekly'
          ? 'You\'ve reached your weekly AI message limit. Resets Monday.'
          : undefined;
        return {
          allowed,
          reason,
          currentUsage: usage?.sessionMessagesUsed || 0,
          limit: plan.sessionMessageLimit,
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
  }, [plan, planId, isOverLimit, blockedBy, sessionTimeLeft, usage]);

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
        sessionRemaining,
        sessionPercentUsed,
        sessionResetsAt,
        sessionTimeLeft,
        weeklyRemaining,
        weeklyPercentUsed,
        weeklyResetsAt,
        isOverLimit,
        blockedBy,
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
