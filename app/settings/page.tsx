'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/common';

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/companies');
  }, [router]);

  return <LoadingSpinner />;
}
