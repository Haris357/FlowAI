import type { PlanDefinition, PlanId, TokenPackDefinition } from '@/types/subscription';

// ==========================================
// PLAN DEFINITIONS (Single Source of Truth)
// ==========================================

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Flowbooks.',
    tokenAllocation: 50_000,
    allowedModels: ['gpt-4.1-mini'],
    maxCompanies: 1,
    maxCollaboratorsPerCompany: 0,
    maxCustomers: 20,
    maxVendors: 20,
    maxInvoicesPerMonth: 10,
    maxRecurringTransactions: 0,
    maxBankAccounts: 1,
    maxEmailSendsPerMonth: 5,
    chatHistoryDays: 7,
    features: {
      allReports: false,
      exportPdfExcel: false,
      payroll: false,
      customBranding: false,
      tokenPurchases: false,
    },
    lemonSqueezyVariantId: '',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    description: 'For growing businesses needing more power.',
    tokenAllocation: 500_000,
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
      tokenPurchases: true,
    },
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID || '',
  },
  max: {
    id: 'max',
    name: 'Max',
    price: 99.99,
    description: 'Advanced features for established teams.',
    tokenAllocation: 2_000_000,
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
      tokenPurchases: true,
    },
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_MAX_VARIANT_ID || '',
  },
};

// ==========================================
// TOKEN PACKS
// ==========================================

export const TOKEN_PACKS: TokenPackDefinition[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 100_000,
    price: 4.99,
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_TOKEN_STARTER_VARIANT_ID || '',
  },
  {
    id: 'power',
    name: 'Power Pack',
    tokens: 500_000,
    price: 19.99,
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_TOKEN_POWER_VARIANT_ID || '',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 2_000_000,
    price: 59.99,
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_TOKEN_ENTERPRISE_VARIANT_ID || '',
  },
];

// ==========================================
// HELPERS
// ==========================================

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId] || PLANS.free;
}

export function getPlanByVariantId(variantId: string): PlanDefinition | null {
  return Object.values(PLANS).find(p => p.lemonSqueezyVariantId === variantId) || null;
}

export function getTokenPack(packId: string): TokenPackDefinition | undefined {
  return TOKEN_PACKS.find(p => p.id === packId);
}

export function getTokenPackByVariantId(variantId: string): TokenPackDefinition | undefined {
  return TOKEN_PACKS.find(p => p.lemonSqueezyVariantId === variantId);
}

export function formatTokens(tokens: number | undefined | null): string {
  if (tokens == null || isNaN(tokens)) return '0';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toString();
}

export function isUnlimited(value: number): boolean {
  return value === -1;
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
