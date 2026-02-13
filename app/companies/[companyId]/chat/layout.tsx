'use client';

import { Box, Stack } from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ChatProvider } from '@/contexts/ChatContext';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();

  // Show loading spinner while auth/company is loading
  if (authLoading || companyLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: 'background.body',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: 'primary.200',
              borderTopColor: 'primary.500',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                to: { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Stack>
      </Box>
    );
  }

  // Must be logged in with a company selected
  if (!user || !company) {
    return null;
  }

  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  );
}
