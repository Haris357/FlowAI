/**
 * Fetch wrapper for admin API calls.
 * Reads the Firebase ID token from the admin sessionStorage session —
 * does NOT touch the shared Firebase client auth instance so the main app
 * is never affected by admin authentication.
 */

function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem('adminSession');
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Reject expired sessions
    if (!session.idToken || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem('adminSession');
      return null;
    }
    return session.idToken as string;
  } catch {
    return null;
  }
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
