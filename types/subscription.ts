import { Timestamp } from 'firebase/firestore';

// ==========================================
// PLAN DEFINITIONS
// ==========================================

export type PlanId = 'free' | 'pro' | 'max';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  tokenAllocation: number;
  allowedModels: string[];
  maxCompanies: number;
  maxCollaboratorsPerCompany: number; // -1 = unlimited
  maxCustomers: number;               // -1 = unlimited
  maxVendors: number;                 // -1 = unlimited
  maxInvoicesPerMonth: number;        // -1 = unlimited
  maxRecurringTransactions: number;   // -1 = unlimited
  maxBankAccounts: number;            // -1 = unlimited
  maxEmailSendsPerMonth: number;      // -1 = unlimited
  chatHistoryDays: number;            // -1 = unlimited
  features: {
    allReports: boolean;
    exportPdfExcel: boolean;
    payroll: boolean;
    customBranding: boolean;
    tokenPurchases: boolean;
  };
  lemonSqueezyVariantId: string;
}

// ==========================================
// SUBSCRIPTION
// ==========================================

export interface UserSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  lemonSqueezyCustomerId: string | null;
  lemonSqueezySubscriptionId: string | null;
  lemonSqueezyVariantId: string | null;
  currentPeriodStart: Timestamp | null;
  currentPeriodEnd: Timestamp | null;
  cancelAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// USAGE TRACKING
// ==========================================

export interface ModelUsageBreakdown {
  input: number;
  output: number;
  total: number;
  requests: number;
}

export interface UsagePeriod {
  userId: string;
  period: string; // "2026-02"
  planId: PlanId;
  tokenAllocation: number;
  tokensUsed: number;
  bonusTokens: number;
  requestCount: number;
  costAccumulated: number;
  breakdown: Record<string, ModelUsageBreakdown>;
  resetAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// TOKEN PURCHASES
// ==========================================

export type TokenPackId = 'starter' | 'power' | 'enterprise';

export interface TokenPackDefinition {
  id: TokenPackId;
  name: string;
  tokens: number;
  price: number;
  lemonSqueezyVariantId: string;
}

export interface TokenPurchase {
  id: string;
  lemonSqueezyOrderId: string;
  packId: TokenPackId;
  tokensAmount: number;
  tokensRemaining: number;
  price: number;
  status: 'completed' | 'refunded';
  purchasedAt: Timestamp;
  expiresAt: Timestamp;
}

// ==========================================
// BILLING HISTORY
// ==========================================

export type BillingEventType =
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'subscription_updated'
  | 'token_purchase'
  | 'payment_failed'
  | 'refund';

export interface BillingEvent {
  id: string;
  type: BillingEventType;
  description: string;
  amount: number;
  currency: string;
  lemonSqueezyEventId: string;
  invoiceUrl: string | null;
  createdAt: Timestamp;
}

// ==========================================
// PLAN LIMIT CHECK
// ==========================================

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: PlanId;
}
