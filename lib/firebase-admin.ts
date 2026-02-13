/**
 * Firebase Admin SDK initialization
 * For use in server-side code (API routes, server actions)
 */

import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app';

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for configuration
 * Safe to call multiple times (only initializes once)
 */
export function initAdmin() {
  // Check if already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Option 1: Use service account JSON from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

      return initializeApp({
        credential: cert(serviceAccount),
      });
    }

    // Option 2: Use individual environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Firebase private keys have escaped newlines in env vars
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    // Option 3: Default credentials (works in Firebase/Google Cloud environments)
    console.warn('No Firebase Admin credentials found in environment. Using default credentials.');
    return initializeApp();
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}
