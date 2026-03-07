'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { LoadingSpinner } from '@/components/common';

/**
 * Billing page — handles Lemon Squeezy success redirects,
 * then shows the subscription success modal.
 */
export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSubscription, refreshUsage } = useSubscription();
  const { showSubscriptionSuccess } = useSettingsModal();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshSubscription();
      refreshUsage();
      // Small delay to let subscription data refresh before showing modal
      setTimeout(() => showSubscriptionSuccess(), 1500);
    }
    router.replace('/companies');
  }, [searchParams, refreshSubscription, refreshUsage, router, showSubscriptionSuccess]);

  return <LoadingSpinner />;
}
