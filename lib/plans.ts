import type { PlanDefinition, PlanId } from '@/types/subscription';

// ==========================================
// TRIAL CONFIGURATION
// ==========================================

export const TRIAL_DURATION_DAYS = 3;
export const TRIAL_PLAN: PlanId = 'pro'; // New users get a Pro trial

// ==========================================
// PLAN DEFINITIONS (Single Source of Truth)
// ==========================================

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Trial Expired',
    price: 0,
    description: 'Your trial has ended. Subscribe to continue.',
    sessionTokenLimit: 0,
    sessionDurationHours: 0,
    weeklyTokenLimit: 0,
    allowedModels: [],
    maxCompanies: 1,
    maxCollaboratorsPerCompany: 0,
    maxCustomers: 0,
    maxVendors: 0,
    maxInvoicesPerMonth: 0,
    maxRecurringTransactions: 0,
    maxBankAccounts: 0,
    maxEmailSendsPerMonth: 0,
    chatHistoryDays: 0,
    features: {
      allReports: false,
      exportPdfExcel: false,
      payroll: false,
      customBranding: false,
    },
    lemonSqueezyVariantId: '',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    yearlyPrice: 23.99, // 20% off monthly price, billed annually
    description: 'For freelancers & small businesses.',
    sessionTokenLimit: 750_000,
    sessionDurationHours: 4,
    weeklyTokenLimit: 10_000_000,
    allowedModels: ['gpt-4.1-mini', 'gpt-4o-mini'],
    maxCompanies: 3,
    maxCollaboratorsPerCompany: 3,
    maxCustomers: -1,
    maxVendors: -1,
    maxInvoicesPerMonth: -1,
    maxRecurringTransactions: 5,
    maxBankAccounts: 5,
    maxEmailSendsPerMonth: 50,
    chatHistoryDays: 90,
    features: {
      allReports: true,
      exportPdfExcel: true,
      payroll: true,
      customBranding: true,
    },
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID || process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || '',
    yearlyLemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID || process.env.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID || '',
  },
  max: {
    id: 'max',
    name: 'Max',
    price: 99.99,
    yearlyPrice: 79.99, // 20% off monthly price, billed annually
    description: 'For teams & growing organizations.',
    sessionTokenLimit: 2_000_000,
    sessionDurationHours: 4,
    weeklyTokenLimit: 35_000_000,
    allowedModels: ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4o'],
    maxCompanies: 10,
    maxCollaboratorsPerCompany: -1,
    maxCustomers: -1,
    maxVendors: -1,
    maxInvoicesPerMonth: -1,
    maxRecurringTransactions: -1,
    maxBankAccounts: -1,
    maxEmailSendsPerMonth: -1,
    chatHistoryDays: -1,
    features: {
      allReports: true,
      exportPdfExcel: true,
      payroll: true,
      customBranding: true,
    },
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_MAX_VARIANT_ID || process.env.LEMON_SQUEEZY_MAX_VARIANT_ID || '',
    yearlyLemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_MAX_YEARLY_VARIANT_ID || process.env.LEMON_SQUEEZY_MAX_YEARLY_VARIANT_ID || '',
  },
};

// ==========================================
// HELPERS
// ==========================================

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId] || PLANS.free;
}

export function getPlanByVariantId(variantId: string): PlanDefinition | null {
  return Object.values(PLANS).find(
    p => p.lemonSqueezyVariantId === variantId || p.yearlyLemonSqueezyVariantId === variantId
  ) || null;
}

export function formatMessages(count: number | undefined | null): string {
  if (count == null || isNaN(count)) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getCurrentDay(): string {
  return new Date().toISOString().slice(0, 10); // "2026-03-02"
}

/** Returns Monday's date for the current week as "YYYY-MM-DD" */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // Distance from Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

/** Returns next Monday's date as "YYYY-MM-DD" */
export function getNextWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  return nextMonday.toISOString().slice(0, 10);
}

/** Format milliseconds as "Xh Ym" or "Xd Yh" for longer durations */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Get trial end date (N days from now) */
export function getTrialEndDate(daysFromNow: number = TRIAL_DURATION_DAYS): Date {
  const end = new Date();
  end.setDate(end.getDate() + daysFromNow);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Check if a trial has expired */
export function isTrialExpired(trialEndsAt: any): boolean {
  if (!trialEndsAt) return true;

  let endMs = 0;
  if (typeof trialEndsAt.toMillis === 'function') {
    endMs = trialEndsAt.toMillis();
  } else if (typeof trialEndsAt.toDate === 'function') {
    endMs = trialEndsAt.toDate().getTime();
  } else if (trialEndsAt.seconds != null) {
    endMs = trialEndsAt.seconds * 1000;
  } else if (trialEndsAt._seconds != null) {
    endMs = trialEndsAt._seconds * 1000;
  } else if (trialEndsAt instanceof Date) {
    endMs = trialEndsAt.getTime();
  } else if (typeof trialEndsAt === 'number') {
    endMs = trialEndsAt;
  }

  // If we couldn't parse the timestamp, assume NOT expired (safe default for new users)
  if (!endMs) return false;
  return Date.now() > endMs;
}

export const DEFAULT_SUBSCRIPTION = {
  planId: 'pro' as PlanId,
  status: 'trialing' as const,
  lemonSqueezyCustomerId: null,
  lemonSqueezySubscriptionId: null,
  lemonSqueezyVariantId: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAt: null,
  trialEndsAt: null,
  trialStartedAt: null,
};
