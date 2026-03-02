'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ChatProvider } from '@/contexts/ChatContext';
import TokenLimitModal from '@/components/subscription/TokenLimitModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { company } = useCompany();

  // Parent CompanyLayout already handles auth/company loading states
  if (!user || !company) {
    return null;
  }

  return (
    <ChatProvider>
      {children}
      <TokenLimitModal />
    </ChatProvider>
  );
}
