'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReportsIndexPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId as string;

  useEffect(() => {
    // Redirect to default report (profit-loss)
    router.replace(`/companies/${companyId}/reports/profit-loss`);
  }, [router, companyId]);

  return null;
}
