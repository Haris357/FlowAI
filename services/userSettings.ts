import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  numberFormat: 'comma' | 'period';
  notifyEmail: boolean;
  notifyInvoices: boolean;
  notifyBills: boolean;
  notifyWeekly: boolean;
  updatedAt?: any;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'comma',
  notifyEmail: true,
  notifyInvoices: true,
  notifyBills: true,
  notifyWeekly: false,
};

/**
 * Get user settings from Firestore
 * Returns default settings if none exist
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data() as UserSettings;
    }

    // Return defaults if no settings exist
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update user settings in Firestore
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    const settingsSnap = await getDoc(settingsRef);

    const dataToUpdate = {
      ...settings,
      updatedAt: serverTimestamp(),
    };

    if (settingsSnap.exists()) {
      // Update existing settings
      await updateDoc(settingsRef, dataToUpdate);
    } else {
      // Create new settings document
      await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        ...dataToUpdate,
      });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

/**
 * Update user profile (name, photoURL)
 */
export async function updateUserProfile(
  userId: string,
  profile: { name?: string; photoURL?: string }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
