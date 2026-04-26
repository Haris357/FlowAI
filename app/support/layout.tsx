'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { Box, CircularProgress } from '@mui/joy';

/**
 * Layout for every /support route. Enforces that the visitor is signed in.
 * Unauthenticated users are bounced to /login with a post-login redirect back.
 */
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // While we redeem an `#authToken=...` fragment from the cross-subdomain
  // login handoff, hold off on the unauthenticated redirect — otherwise we'd
  // bounce back to /login before the sign-in completes.
  const [redeemingHandoff, setRedeemingHandoff] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('authToken=');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.includes('authToken=')) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const token = params.get('authToken');
    // Strip the token from the URL immediately so it doesn't linger in
    // history or get shared by accident.
    history.replaceState(null, '', window.location.pathname + window.location.search);

    if (!token) {
      setRedeemingHandoff(false);
      return;
    }

    signInWithCustomToken(auth, token)
      .catch((err) => {
        console.error('Failed to redeem cross-domain auth token:', err);
      })
      .finally(() => {
        setRedeemingHandoff(false);
      });
  }, []);

  useEffect(() => {
    if (loading || redeemingHandoff) return;
    if (!user) {
      // Support runs on a separate subdomain (support.flowbooksai.com) so we
      // must redirect to the main app's /login page using an absolute URL.
      // A relative /login would be rewritten by middleware to /support/login (404).
      const returnTo =
        typeof window !== 'undefined'
          ? window.location.href
          : (process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://support.flowbooksai.com');
      const loginBase =
        process.env.NEXT_PUBLIC_APP_URL || 'https://flowbooksai.com';
      window.location.href = `${loginBase}/login?next=${encodeURIComponent(returnTo)}`;
    }
  }, [user, loading, redeemingHandoff, router]);

  if (loading || redeemingHandoff || !user) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'background.surface',
      }}>
        <CircularProgress size="md" sx={{ '--CircularProgress-trackColor': 'transparent' }} />
      </Box>
    );
  }

  return <>{children}</>;
}
