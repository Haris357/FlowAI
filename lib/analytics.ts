import { posthog, POSTHOG_KEY } from '@/lib/posthog';

function track(event: string, properties?: Record<string, any>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

// Auth events
export const analytics = {
  // Auth
  userSignedUp: (method: 'email' | 'google') => track('user_signed_up', { method }),
  userSignedIn: (method: 'email' | 'google') => track('user_signed_in', { method }),
  userSignedOut: () => track('user_signed_out'),

  // Onboarding
  companyCreated: (companyId: string) => track('company_created', { company_id: companyId }),
  onboardingCompleted: () => track('onboarding_completed'),

  // Chat / AI
  chatCreated: (chatId: string) => track('chat_created', { chat_id: chatId }),
  messageSent: (chatId: string, model?: string) => track('message_sent', { chat_id: chatId, model }),
  aiResponseReceived: (chatId: string, model?: string, tokens?: number) =>
    track('ai_response_received', { chat_id: chatId, model, tokens }),

  // Subscription
  planUpgraded: (fromPlan: string, toPlan: string) => track('plan_upgraded', { from_plan: fromPlan, to_plan: toPlan }),
  planDowngraded: (fromPlan: string, toPlan: string) => track('plan_downgraded', { from_plan: fromPlan, to_plan: toPlan }),
  messageLimitHit: (plan: string) => track('message_limit_hit', { plan }),

  // Features
  invoiceCreated: () => track('invoice_created'),
  reportGenerated: (type: string) => track('report_generated', { type }),
  transactionRecorded: (type: string) => track('transaction_recorded', { type }),
  contactCreated: () => track('contact_created'),
  feedbackSubmitted: (rating?: number) => track('feedback_submitted', { rating }),

  // Engagement
  featureUsed: (feature: string) => track('feature_used', { feature }),
  pageViewed: (page: string) => track('page_viewed', { page }),
};
