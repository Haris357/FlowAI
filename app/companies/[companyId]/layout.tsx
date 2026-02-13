'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Box, CircularProgress } from '@mui/joy';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const companyId = params.companyId as string;
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateCompany() {
      if (authLoading) return;

      if (!user) {
        router.replace('/login');
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
        const hasAccess =
          data.ownerId === user.uid ||
          data.collaboratorEmails?.includes(user.email);

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
  }, [companyId, user, authLoading, router]);

  if (authLoading || validating) {
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
