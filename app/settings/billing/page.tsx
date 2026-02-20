'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { LoadingSpinner } from '@/components/common';
import toast from 'react-hot-toast';

/**
 * Billing page — handles Lemon Squeezy success redirects,
 * then forwards to /settings?section=subscription.
 */
export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSubscription, refreshUsage } = useSubscription();

  useEffect(() => {
    // Handle Lemon Squeezy success callbacks
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Welcome aboard.');
      refreshSubscription();
      refreshUsage();
    }
    if (searchParams.get('token_purchase') === 'true') {
      toast.success('Token pack purchased successfully!');
      refreshUsage();
    }

    // Redirect to companies page (settings is now a modal)
    router.replace('/companies');
  }, [searchParams, refreshSubscription, refreshUsage, router]);

  return <LoadingSpinner />;
}
