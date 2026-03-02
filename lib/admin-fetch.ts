/**
 * Fetch wrapper for admin API calls.
 * Automatically attaches Firebase ID token as Authorization header.
 * Waits for Firebase auth to initialize before making requests.
 */

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Wait for Firebase auth to finish initializing (max 5 seconds).
 * Returns the current user (or null) once auth state is known.
 */
function waitForAuth(): Promise<typeof auth.currentUser> {
  return new Promise((resolve) => {
    // If already available, resolve immediately
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    // Safety timeout — don't hang forever if auth never fires
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token: string | null = null;

  // Wait for Firebase auth to initialize, then get a fresh ID token
  const user = await waitForAuth();
  if (user) {
    try {
      token = await user.getIdToken(true); // force refresh to ensure validity
    } catch {
      // Fall through — request will fail with 401 on server
    }
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
