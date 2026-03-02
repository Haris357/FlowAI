import type { PlanDefinition, PlanId } from '@/types/subscription';

// ==========================================
// PLAN DEFINITIONS (Single Source of Truth)
// ==========================================

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Flowbooks.',
    sessionMessageLimit: 25,
    sessionDurationHours: 5,
    weeklyMessageLimit: 150,
    allowedModels: ['gpt-4.1-mini'],
    maxCompanies: 1,
    maxCollaboratorsPerCompany: 0,
    maxCustomers: 10,
    maxVendors: 10,
    maxInvoicesPerMonth: 5,
    maxRecurringTransactions: 0,
    maxBankAccounts: 1,
    maxEmailSendsPerMonth: 0,
    chatHistoryDays: 7,
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
    description: 'For growing businesses needing more power.',
    sessionMessageLimit: 100,
    sessionDurationHours: 4,
    weeklyMessageLimit: 750,
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
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID || '',
  },
  max: {
    id: 'max',
    name: 'Max',
    price: 99.99,
    description: 'Advanced features for established teams.',
    sessionMessageLimit: 400,
    sessionDurationHours: 4,
    weeklyMessageLimit: 3000,
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
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_MAX_VARIANT_ID || '',
  },
};

// ==========================================
// HELPERS
// ==========================================

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId] || PLANS.free;
}

export function getPlanByVariantId(variantId: string): PlanDefinition | null {
  return Object.values(PLANS).find(p => p.lemonSqueezyVariantId === variantId) || null;
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

/** Format milliseconds as "Xh Ym" */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export const DEFAULT_SUBSCRIPTION = {
  planId: 'free' as PlanId,
  status: 'active' as const,
  lemonSqueezyCustomerId: null,
  lemonSqueezySubscriptionId: null,
  lemonSqueezyVariantId: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAt: null,
};
