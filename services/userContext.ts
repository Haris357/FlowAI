/**
 * Persistent Business Context
 * Stores learned user/business patterns so the AI always has context
 * about the user's regular customers, pricing rules, and preferences.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

export interface UserBusinessContext {
  regularCustomers: string[];   // e.g. ["Jonas - script writing client"]
  pricingRules: string[];       // e.g. ["Scripts: $0.025/word for 3000+ words"]
  commonServices: string[];     // e.g. ["Script writing", "Content creation"]
  notes: string[];              // Any other recurring patterns
  updatedAt: any;
}

const EMPTY_CONTEXT: Omit<UserBusinessContext, 'updatedAt'> = {
  regularCustomers: [],
  pricingRules: [],
  commonServices: [],
  notes: [],
};

/**
 * Get business context for a user
 */
export async function getUserBusinessContext(
  companyId: string,
  userId: string
): Promise<UserBusinessContext | null> {
  try {
    const docRef = adminDb
      .collection(`companies/${companyId}/userContext`)
      .doc(userId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data() as UserBusinessContext;
  } catch (error) {
    console.error('[UserContext] Error getting context:', error);
    return null;
  }
}

/**
 * Update business context — merges new entries with existing ones (deduplicates)
 */
export async function updateUserBusinessContext(
  companyId: string,
  userId: string,
  updates: Partial<Omit<UserBusinessContext, 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = adminDb
      .collection(`companies/${companyId}/userContext`)
      .doc(userId);
    const snap = await docRef.get();
    const existing = snap.exists ? (snap.data() as UserBusinessContext) : { ...EMPTY_CONTEXT };

    // Merge arrays, deduplicating by lowercased value
    const mergeArrays = (existing: string[], incoming: string[] | undefined): string[] => {
      if (!incoming || incoming.length === 0) return existing;
      const seen = new Set(existing.map(s => s.toLowerCase()));
      const merged = [...existing];
      for (const item of incoming) {
        if (!seen.has(item.toLowerCase())) {
          merged.push(item);
          seen.add(item.toLowerCase());
        }
      }
      return merged;
    };

    const merged: UserBusinessContext = {
      regularCustomers: mergeArrays(existing.regularCustomers || [], updates.regularCustomers),
      pricingRules: mergeArrays(existing.pricingRules || [], updates.pricingRules),
      commonServices: mergeArrays(existing.commonServices || [], updates.commonServices),
      notes: mergeArrays(existing.notes || [], updates.notes),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(merged, { merge: true });
  } catch (error) {
    console.error('[UserContext] Error updating context:', error);
  }
}

/**
 * Extract business context from a conversation summary using OpenAI.
 * Called after compaction to learn recurring patterns.
 */
export async function extractBusinessContext(
  summary: string
): Promise<Omit<UserBusinessContext, 'updatedAt'> | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `Extract structured business context from a conversation summary. Return a JSON object with these arrays (each entry is a short descriptive string):
- regularCustomers: customer/vendor names and their relationship (e.g. "Jonas - script writing client")
- pricingRules: pricing structures mentioned (e.g. "$0.025/word for scripts over 3000 words")
- commonServices: services/products the user regularly deals with
- notes: any other recurring business patterns or preferences

Return ONLY valid JSON, no markdown. If a category has no entries, use an empty array.`,
          },
          {
            role: 'user',
            content: `Extract business context from this summary:\n\n${summary}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      regularCustomers: parsed.regularCustomers || [],
      pricingRules: parsed.pricingRules || [],
      commonServices: parsed.commonServices || [],
      notes: parsed.notes || [],
    };
  } catch (error) {
    console.error('[UserContext] Failed to extract business context:', error);
    return null;
  }
}

/**
 * Build a system prompt snippet from user business context.
 */
export function buildBusinessContextPrompt(ctx: UserBusinessContext): string {
  const parts: string[] = [];

  if (ctx.regularCustomers?.length) {
    parts.push(`Known customers/vendors: ${ctx.regularCustomers.join('; ')}`);
  }
  if (ctx.pricingRules?.length) {
    parts.push(`Known pricing rules: ${ctx.pricingRules.join('; ')}`);
  }
  if (ctx.commonServices?.length) {
    parts.push(`Common services/products: ${ctx.commonServices.join('; ')}`);
  }
  if (ctx.notes?.length) {
    parts.push(`Business notes: ${ctx.notes.join('; ')}`);
  }

  if (parts.length === 0) return '';

  return `\n\n[USER BUSINESS CONTEXT — Use this to better understand the user's business]\n${parts.join('\n')}`;
}
