'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress } from '@mui/joy';

/**
 * Layout for every /support route. Enforces that the visitor is signed in.
 * Unauthenticated users are bounced to /login with a post-login redirect back.
 */
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
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
  }, [user, loading, router]);

  if (loading || !user) {
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
