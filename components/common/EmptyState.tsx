'use client';
import { Box, Typography, Stack } from '@mui/joy';
import { FileX, Users, Building2, UserCheck, Receipt, ArrowLeftRight, Wallet, BookOpen, DollarSign, FileText } from 'lucide-react';

interface EmptyStateProps {
  type?: 'invoices' | 'customers' | 'vendors' | 'employees' | 'transactions' | 'accounts' | 'bills' | 'journal' | 'payroll' | 'generic';
  title?: string;
  description?: string;
}

const icons = {
  invoices: Receipt,
  customers: Users,
  vendors: Building2,
  employees: UserCheck,
  transactions: ArrowLeftRight,
  accounts: Wallet,
  bills: FileText,
  journal: BookOpen,
  payroll: DollarSign,
  generic: FileX,
};

const defaultMessages = {
  invoices: {
    title: 'No invoices yet',
    description: 'Start by telling the AI to create an invoice for a customer.',
  },
  customers: {
    title: 'No customers yet',
    description: 'Tell the AI to add a customer to get started.',
  },
  vendors: {
    title: 'No vendors yet',
    description: 'Tell the AI to add a vendor when you record an expense.',
  },
  employees: {
    title: 'No employees yet',
    description: 'Tell the AI to add employees for payroll management.',
  },
  transactions: {
    title: 'No transactions yet',
    description: 'Start recording income and expenses through the chat.',
  },
  accounts: {
    title: 'No accounts yet',
    description: 'Your chart of accounts will appear here once set up.',
  },
  bills: {
    title: 'No bills yet',
    description: 'Tell the AI to record a bill from a vendor.',
  },
  journal: {
    title: 'No journal entries yet',
    description: 'Journal entries will appear here as you record transactions.',
  },
  payroll: {
    title: 'No salary slips yet',
    description: 'Tell the AI to generate salary slips for this period.',
  },
  generic: {
    title: 'No data found',
    description: 'There is nothing to display here yet.',
  },
};

export default function EmptyState({ type = 'generic', title, description }: EmptyStateProps) {
  const Icon = icons[type];
  const defaultMessage = defaultMessages[type];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Stack alignItems="center" spacing={2} sx={{ maxWidth: 400, textAlign: 'center' }}>
        <Box
          sx={{
            p: 3,
            borderRadius: '50%',
            bgcolor: 'neutral.100',
            color: 'neutral.500',
          }}
        >
          <Icon size={48} />
        </Box>
        <Typography level="title-lg">
          {title || defaultMessage.title}
        </Typography>
        <Typography level="body-md" sx={{ color: 'text.secondary' }}>
          {description || defaultMessage.description}
        </Typography>
      </Stack>
    </Box>
  );
}
