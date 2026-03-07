'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { initPostHog, posthog, POSTHOG_KEY } from '@/lib/posthog';
import { isAdminEmail } from '@/lib/admin';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Initialize PostHog
  useEffect(() => {
    initPostHog();
  }, []);

  // Identify user when auth changes
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (user && !isAdminEmail(user.email)) {
      posthog.identify(user.uid, {
        email: user.email,
        name: user.displayName,
      });
    } else if (!user) {
      posthog.reset();
    }
  }, [user]);

  // Track page views
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const url = window.location.origin + pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
