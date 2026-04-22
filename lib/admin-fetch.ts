/**
 * Fetch wrapper for admin API calls.
 * Reads the admin JWT from sessionStorage — does NOT touch any shared
 * Firebase auth instance, so the main app is never affected.
 */

const SESSION_KEY = 'adminSession';

export interface AdminSession {
  token: string;
  expiresAt: number;       // ms epoch
  admin: {
    id: string;
    username: string;
    name: string;
    role: 'super_admin' | 'admin' | 'editor' | 'viewer';
    permissionsOverride?: string[] | null;
  };
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.token || !session.expiresAt || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = getAdminSession();
  const headers = new Headers(options.headers);
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const res = await fetch(url, { ...options, headers });

  // If the session is no longer valid server-side, clear locally so the next
  // navigation forces re-login.
  if (res.status === 401) {
    clearAdminSession();
  }

  return res;
}
