'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Box, CircularProgress } from '@mui/joy';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isTrialExpired: trialExpired, isTrial, loading: subLoading } = useSubscription();
  const companyId = params.companyId as string;
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateCompany() {
      if (authLoading || subLoading) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      // Block expired trial users — redirect to companies page
      if (isTrial && trialExpired) {
        router.replace('/companies');
        return;
      }

      if (!companyId) {
        router.replace('/companies');
        return;
      }

      // Validate company exists and user has access
      try {
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (!companyDoc.exists()) {
          router.replace('/companies');
          return;
        }

        const data = companyDoc.data();

        // Check access: owner, member (subcollection), or legacy collaborator
        let hasAccess = data.ownerId === user.uid;
        if (!hasAccess) {
          try {
            const memberSnap = await getDoc(doc(db, 'companies', companyId, 'members', user.uid));
            hasAccess = memberSnap.exists();
          } catch { /* ignore */ }
        }
        if (!hasAccess) {
          hasAccess = data.collaboratorEmails?.includes(user.email) || false;
        }

        if (!hasAccess) {
          router.replace('/companies');
          return;
        }

        // Sync to localStorage for compatibility
        localStorage.setItem('selectedCompanyId', companyId);
        setIsValid(true);
      } catch (error) {
        console.error('Error validating company access:', error);
        router.replace('/companies');
      } finally {
        setValidating(false);
      }
    }

    validateCompany();
  }, [companyId, user, authLoading, subLoading, isTrial, trialExpired, router]);

  if (authLoading || subLoading || validating) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.body',
        }}
      >
        <CircularProgress size="lg" />
      </Box>
    );
  }

  if (!isValid) {
    return null;
  }

  return (
    <CompanyProvider urlCompanyId={companyId}>
      {children}
    </CompanyProvider>
  );
}
