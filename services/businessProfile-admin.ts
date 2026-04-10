/**
 * Server-side (Admin SDK) reader for BusinessProfile + SavedTemplates.
 * Used in the AI chat route to inject user business context into the system prompt.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import {
  BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  INDUSTRY_LABELS,
  FISCAL_MONTH_LABELS,
} from '@/types/businessProfile';

initAdmin();
const adminDb = getFirestore();

// L1 cache: 5 min in-memory per (companyId+userId)
const cache = new Map<string, { profile: BusinessProfile; at: number }>();
const CACHE_TTL = 5 * 60_000;

export async function getBusinessProfileAdmin(
  companyId: string,
  userId: string,
): Promise<BusinessProfile | null> {
  const key = `${companyId}:${userId}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.profile;

  try {
    const snap = await adminDb
      .collection(`companies/${companyId}/businessProfiles`)
      .doc(userId)
      .get();

    if (!snap.exists) return null;
    const profile = snap.data() as BusinessProfile;
    cache.set(key, { profile, at: Date.now() });
    return profile;
  } catch {
    return null;
  }
}

export function invalidateBusinessProfileCache(companyId: string, userId: string) {
  cache.delete(`${companyId}:${userId}`);
}

/**
 * Build a concise prompt snippet from the user's business profile.
 * Injected after the company snapshot in the system prompt.
 */
export function buildBusinessProfilePrompt(profile: BusinessProfile): string {
  const lines: string[] = [];

  lines.push('\n\n--- USER BUSINESS PROFILE ---');

  if (profile.industry && profile.industry !== 'other') {
    lines.push(`Industry: ${INDUSTRY_LABELS[profile.industry] ?? profile.industry}`);
  }
  if (profile.businessSize) {
    const sizeMap: Record<string, string> = { solo: 'Solo / Freelancer', small: 'Small Business', medium: 'Medium Business', enterprise: 'Enterprise' };
    lines.push(`Business Size: ${sizeMap[profile.businessSize] ?? profile.businessSize}`);
  }
  if (profile.taxSystem && profile.taxSystem !== 'None') {
    lines.push(`Tax System: ${profile.taxSystem}${profile.taxRate ? ` @ ${profile.taxRate}%` : ''}`);
  }
  if (profile.fiscalYearStart) {
    lines.push(`Fiscal Year Start: ${FISCAL_MONTH_LABELS[profile.fiscalYearStart] ?? profile.fiscalYearStart}`);
  }
  if (profile.defaultPaymentTerms) {
    lines.push(`Default Payment Terms: Net ${profile.defaultPaymentTerms}`);
  }
  if (profile.defaultAIMode && profile.defaultAIMode !== 'conversational') {
    const modeMap: Record<string, string> = { formal: 'Formal', brief: 'Brief & concise', detailed: 'Detailed & thorough' };
    lines.push(`Preferred AI Style: ${modeMap[profile.defaultAIMode] ?? profile.defaultAIMode}`);
  }
  if (profile.responseLanguage && profile.responseLanguage !== 'English') {
    lines.push(`Response Language: ${profile.responseLanguage}`);
  }
  if (profile.defaultTimeScope) {
    const scopeMap: Record<string, string> = { thisweek: 'This Week', thismonth: 'This Month', thisyear: 'This Year' };
    lines.push(`Default Time Scope: ${scopeMap[profile.defaultTimeScope] ?? profile.defaultTimeScope}`);
  }
  if (profile.commonServices?.length) {
    lines.push(`Common Services/Products: ${profile.commonServices.join(', ')}`);
  }
  if (profile.businessDescription?.trim()) {
    lines.push(`Business Description: ${profile.businessDescription.trim()}`);
  }

  if (profile.defaultAIMode === 'brief') {
    lines.push('\nIMPORTANT: This user prefers BRIEF responses. Be concise. Avoid long explanations unless asked.');
  } else if (profile.defaultAIMode === 'formal') {
    lines.push('\nIMPORTANT: This user prefers a FORMAL tone. Use professional language throughout.');
  } else if (profile.defaultAIMode === 'detailed') {
    lines.push('\nIMPORTANT: This user prefers DETAILED responses. Explain your reasoning and provide thorough context.');
  }

  if (profile.responseLanguage && profile.responseLanguage !== 'English') {
    lines.push(`\nIMPORTANT: Respond in ${profile.responseLanguage} unless the user writes in a different language.`);
  }

  lines.push('--- END USER BUSINESS PROFILE ---');
  return lines.join('\n');
}
