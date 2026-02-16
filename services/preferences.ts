import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AccountPreferences } from '@/types';

const PREFERENCES_DOC_ID = 'account_preferences';

/**
 * Get account preferences for a company
 * Returns empty object if no preferences are set yet
 */
export async function getAccountPreferences(companyId: string): Promise<AccountPreferences> {
  const prefRef = doc(db, `companies/${companyId}/settings`, PREFERENCES_DOC_ID);
  const snapshot = await getDoc(prefRef);

  if (!snapshot.exists()) {
    return {};
  }

  const data = snapshot.data();
  // Strip Firestore metadata fields, return only preference fields
  const {
    updatedAt,
    createdAt,
    ...preferences
  } = data;

  return preferences as AccountPreferences;
}

/**
 * Update account preferences for a company (merge with existing)
 */
export async function updateAccountPreferences(
  companyId: string,
  preferences: Partial<AccountPreferences>
): Promise<void> {
  const prefRef = doc(db, `companies/${companyId}/settings`, PREFERENCES_DOC_ID);
  await setDoc(prefRef, {
    ...preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
