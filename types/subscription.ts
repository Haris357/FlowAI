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
  sessionMessageLimit: number;       // Messages per session
  sessionDurationHours: number;      // Session window in hours
  weeklyMessageLimit: number;        // Messages per week
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
  // Trial fields
  trialEndsAt: Timestamp | null;       // When the free trial expires
  trialStartedAt: Timestamp | null;    // When the trial was started
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

export interface UsageState {
  userId: string;
  planId: PlanId;
  // Session tracking
  sessionStart: Timestamp;            // When current session began
  sessionMessagesUsed: number;        // Messages used in current session
  sessionLimit: number;               // Snapshot of plan's session limit
  sessionDurationMs: number;          // Snapshot of plan's session duration in ms
  // Weekly tracking
  weekStart: string;                  // "2026-03-02" (Monday of current week)
  weeklyMessagesUsed: number;         // Messages used this week
  weeklyLimit: number;                // Snapshot of plan's weekly limit
  // Admin-granted bonus (applies to weekly)
  bonusMessages: number;
  // Internal cost tracking (admin only)
  totalTokensConsumed: number;
  costAccumulated: number;
  requestCount: number;
  breakdown: Record<string, ModelUsageBreakdown>;
  updatedAt: Timestamp;
}

/** @deprecated kept for historical data — replaced by UsageState */
export interface DailyUsage {
  userId: string;
  date: string;
  planId: PlanId;
  dailyMessageLimit: number;
  messagesUsed: number;
  bonusMessages: number;
  totalTokensConsumed: number;
  costAccumulated: number;
  requestCount: number;
  breakdown: Record<string, ModelUsageBreakdown>;
  resetAt: Timestamp;
  updatedAt: Timestamp;
}

/** @deprecated kept for historical billing data */
export type TokenPackId = 'starter' | 'power' | 'enterprise';

/** @deprecated kept for historical billing data */
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
  | 'token_purchase' // @deprecated — kept for historical billing data
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
