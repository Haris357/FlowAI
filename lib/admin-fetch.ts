/**
 * Fetch wrapper for admin API calls.
 * Automatically attaches Firebase ID token as Authorization header.
 */

import { auth } from '@/lib/firebase';

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token: string | null = null;

  // Get fresh ID token from currently signed-in Firebase user
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
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
