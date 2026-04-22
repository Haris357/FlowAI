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
      const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/support';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
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
