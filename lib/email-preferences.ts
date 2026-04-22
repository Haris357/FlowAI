/**
 * Server-side email preference checking.
 * Uses Firebase Admin to read user settings from Firestore.
 */

import { getFirestore } from 'firebase-admin/firestore';

export interface EmailPreferences {
  notifyEmail: boolean;
  notifyInvoices: boolean;
  notifyBills: boolean;
  notifyWeekly: boolean;
  notifyBlogs: boolean;
}

const DEFAULTS: EmailPreferences = {
  notifyEmail: true,
  notifyInvoices: true,
  notifyBills: true,
  notifyWeekly: true,
  notifyBlogs: true,
};

/**
 * Get a user's email notification preferences.
 */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  try {
    const db = getFirestore();
    const snap = await db.doc(`users/${userId}/settings/preferences`).get();
    if (!snap.exists) return DEFAULTS;
    const data = snap.data()!;
    return {
      notifyEmail: data.notifyEmail ?? true,
      notifyInvoices: data.notifyInvoices ?? true,
      notifyBills: data.notifyBills ?? true,
      notifyWeekly: data.notifyWeekly ?? true,
      notifyBlogs: data.notifyBlogs ?? true,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Check if a user has opted into receiving a specific email category.
 *
 * Categories:
 * - 'transactional': Always sent (payment, subscription, welcome, account warnings)
 * - 'newsletter':    Requires notifyEmail + notifyWeekly
 * - 'blog':          Requires notifyEmail + notifyBlogs (new blog-post alerts)
 * - 'announcement':  Requires notifyEmail
 * - 'invoice':       Requires notifyEmail + notifyInvoices
 * - 'bill':          Requires notifyEmail + notifyBills
 */
export async function canSendEmail(
  userId: string,
  category: 'transactional' | 'newsletter' | 'blog' | 'announcement' | 'invoice' | 'bill',
): Promise<boolean> {
  // Transactional emails always go through
  if (category === 'transactional') return true;

  const prefs = await getEmailPreferences(userId);

  // Master switch is off — block everything except transactional
  if (!prefs.notifyEmail) return false;

  switch (category) {
    case 'newsletter':
      return prefs.notifyWeekly;
    case 'blog':
      return prefs.notifyBlogs;
    case 'invoice':
      return prefs.notifyInvoices;
    case 'bill':
      return prefs.notifyBills;
    case 'announcement':
      return true; // If master is on, announcements go through
    default:
      return true;
  }
}
