'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionGroup,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
  Tooltip,
} from '@mui/joy';
import {
  FileText,
  Receipt,
  Users,
  Building2,
  UserPlus,
  BookOpen,
  CreditCard,
  Calculator,
  ClipboardList,
  Package,
  Landmark,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

export interface FormShortcut {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiredFields: string[];
  prompt: string;
}

export const formShortcuts: FormShortcut[] = [
  {
    id: 'invoice',
    label: 'Invoice',
    icon: <FileText size={16} />,
    requiredFields: ['Customer', 'Items', 'Due Date'],
    prompt: 'Create an invoice for customer [customer name] with items: [item details] due on [date]',
  },
  {
    id: 'bill',
    label: 'Bill',
    icon: <Receipt size={16} />,
    requiredFields: ['Vendor', 'Items', 'Issue Date'],
    prompt: 'Record a bill from vendor [vendor name] for items: [item details] dated [date]',
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: <ClipboardList size={16} />,
    requiredFields: ['Customer', 'Items', 'Valid Until'],
    prompt: 'Create a quote for customer [customer name] with items: [item details] valid until [date]',
  },
  {
    id: 'purchase-order',
    label: 'Purchase Order',
    icon: <Package size={16} />,
    requiredFields: ['Vendor', 'Items', 'Delivery Date'],
    prompt: 'Create a purchase order for vendor [vendor name] with items: [item details] delivery by [date]',
  },
  {
    id: 'customer',
    label: 'Customer',
    icon: <Users size={16} />,
    requiredFields: ['Name'],
    prompt: 'Add a new customer named [name]',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    icon: <Building2 size={16} />,
    requiredFields: ['Name'],
    prompt: 'Add a new vendor named [name]',
  },
  {
    id: 'employee',
    label: 'Employee',
    icon: <UserPlus size={16} />,
    requiredFields: ['Name', 'Designation', 'Salary'],
    prompt: 'Add employee [name] as [designation] with salary [amount]',
  },
  {
    id: 'expense',
    label: 'Expense',
    icon: <CreditCard size={16} />,
    requiredFields: ['Description', 'Amount', 'Category'],
    prompt: 'Record expense of $[amount] for [description] in category [category]',
  },
  {
    id: 'journal',
    label: 'Journal Entry',
    icon: <BookOpen size={16} />,
    requiredFields: ['Date', 'Debit Account', 'Credit Account', 'Amount'],
    prompt: 'Create a journal entry on [date] debiting [account] and crediting [account] for $[amount]',
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: <DollarSign size={16} />,
    requiredFields: ['Customer/Vendor', 'Amount', 'Invoice/Bill'],
    prompt: 'Record a payment of $[amount] received from [customer] for invoice [invoice number]',
  },
  {
    id: 'account',
    label: 'Account',
    icon: <Calculator size={16} />,
    requiredFields: ['Name', 'Type', 'Subtype'],
    prompt: 'Create a new [type] account called [name] under [subtype]',
  },
  {
    id: 'transaction',
    label: 'Transaction',
    icon: <Landmark size={16} />,
    requiredFields: ['Bank Account', 'Type', 'Amount'],
    prompt: 'Record a [deposit/withdrawal] of $[amount] in [bank account]',
  },
];

interface FormShortcutsProps {
  collapsed?: boolean;
  onSelectShortcut: (shortcut: FormShortcut) => void;
}

export default function FormShortcuts({ collapsed = false, onSelectShortcut }: FormShortcutsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (collapsed) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: 0.5 }}>
        {formShortcuts.map((shortcut) => (
          <Tooltip key={shortcut.id} title={shortcut.label} placement="right" arrow>
            <Box
              onClick={() => onSelectShortcut(shortcut)}
              sx={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'md',
                cursor: 'pointer',
                color: 'text.secondary',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: 'primary.softBg',
                  color: 'primary.600',
                },
              }}
            >
              {shortcut.icon}
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <AccordionGroup
      size="sm"
      sx={{
        gap: 0,
        '& .MuiAccordion-root': {
          borderColor: 'transparent',
          marginTop: 0,
          marginBottom: 0,
          '&:not(:last-child)': {
            borderBottom: 'none',
          },
          '&::before': {
            display: 'none',
          },
        },
      }}
    >
      {formShortcuts.map((shortcut, index) => (
        <Accordion
          key={shortcut.id}
          expanded={expandedIndex === index}
          onChange={(_, expanded) => setExpandedIndex(expanded ? index : null)}
        >
          <AccordionSummary
            indicator={<ChevronRight size={14} />}
            sx={{
              px: 1.5,
              py: 0.25,
              minHeight: 32,
              fontSize: '13px',
              '& .MuiAccordionSummary-indicator': {
                transition: 'transform 0.2s',
              },
              '&[aria-expanded="true"] .MuiAccordionSummary-indicator': {
                transform: 'rotate(90deg)',
              },
              '&:hover': {
                bgcolor: 'background.level1',
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: 'primary.500', display: 'flex' }}>{shortcut.icon}</Box>
              <Typography level="body-sm">{shortcut.label}</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, py: 0.75, bgcolor: 'background.level1' }}>
            <Stack spacing={1}>
              <Box>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5, fontWeight: 600 }}>
                  Required Fields:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {shortcut.requiredFields.map((field) => (
                    <Chip
                      key={field}
                      size="sm"
                      variant="soft"
                      color="neutral"
                      sx={{ fontSize: '10px', height: 20 }}
                    >
                      {field}
                    </Chip>
                  ))}
                </Stack>
              </Box>
              <Box
                onClick={() => onSelectShortcut(shortcut)}
                sx={{
                  py: 0.75,
                  px: 1,
                  borderRadius: 'sm',
                  bgcolor: 'primary.softBg',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: 'primary.softHoverBg',
                  },
                }}
              >
                <Typography level="body-xs" sx={{ color: 'primary.700', fontWeight: 600 }}>
                  Use this template →
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </AccordionGroup>
  );
}
