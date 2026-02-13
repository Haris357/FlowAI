'use client';

import { useState } from 'react';
import { Box, Stack, Typography, Avatar, Divider, Chip } from '@mui/joy';
import {
  User,
  Copy,
  Check,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  FileText,
  Building2,
  UserCheck,
  Wallet,
  Mail,
  Phone,
  Receipt,
  BookOpen,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Store,
  ClipboardList,
  PieChart,
  FileCheck,
  ShoppingCart,
  RotateCcw,
  Landmark,
  Banknote,
  RefreshCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage as ChatMessageType } from '@/types';
import { RichResponse, ActionButton } from '@/lib/ai-config';
import AnimatedLogo from './AnimatedLogo';
import ChatDataGrid from './ChatDataGrid';
import ChatActionButtons from './ChatActionButtons';
import EntityDetailModal from './EntityDetailModal';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
  userPhotoUrl?: string;
  userName?: string;
  richData?: RichResponse['data'];
  actions?: ActionButton[];
  followUp?: string;
  onSendMessage?: (content: string) => void;
}

// Simple markdown-like text renderer
function RichText({ content }: { content: string }) {
  // Parse bold (**text**) and newlines
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Typography
      level="body-md"
      component="div"
      sx={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.7,
        color: 'text.primary',
        '& strong': {
          fontWeight: 600,
          color: 'text.primary',
        },
      }}
    >
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </Typography>
  );
}

// ==========================================
// ENTITY INLINE CARD - Clean, type-specific compact cards
// ==========================================

function formatInlineCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '$0.00';
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatInlineDate(date: any): string {
  if (!date) return '';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(date).split('T')[0] || '';
  }
}

function EntityInlineCard({ entity, entityType }: { entity: Record<string, any>; entityType?: string }) {
  const type = entityType || 'generic';

  // Transaction card
  if (type === 'transaction') {
    const isExpense = entity.type === 'expense';
    const journalLines = entity.journalLines as { accountName: string; accountCode?: string; debit: number; credit: number }[] | undefined;
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            bgcolor: isExpense ? 'warning.softBg' : 'success.softBg',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: isExpense ? 'warning.plainColor' : 'success.plainColor',
                color: 'common.white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isExpense ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
            </Box>
            <Box>
              <Typography level="title-sm" fontWeight="lg">
                {entity.description || 'Transaction'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="sm" variant="soft" color={isExpense ? 'warning' : 'success'}
                  sx={{ fontSize: '11px', fontWeight: 600 }}
                >
                  {entity.type?.toUpperCase() || 'EXPENSE'}
                </Chip>
              </Stack>
            </Box>
          </Stack>
          <Typography level="h4" fontWeight="lg" color={isExpense ? 'warning' : 'success'}>
            {isExpense ? '-' : '+'}{formatInlineCurrency(entity.amount)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={3} sx={{ px: 2.5, py: 1.5, bgcolor: 'background.surface' }}>
          {entity.date && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Calendar size={13} style={{ opacity: 0.5 }} />
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                {formatInlineDate(entity.date)}
              </Typography>
            </Stack>
          )}
          {entity.category && (
            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
              {entity.category}
            </Typography>
          )}
          {entity.paymentMethod && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CreditCard size={13} style={{ opacity: 0.5 }} />
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                {entity.paymentMethod.replace(/_/g, ' ')}
              </Typography>
            </Stack>
          )}
        </Stack>
        {/* Accounting Impact */}
        {journalLines && journalLines.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1' }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <BookOpen size={12} style={{ opacity: 0.5 }} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                Journal Entry
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              {journalLines.map((line, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="sm"
                    variant="outlined"
                    color={line.debit > 0 ? 'warning' : 'success'}
                    sx={{ fontSize: '10px', fontWeight: 700, minWidth: 28, justifyContent: 'center', '--Chip-paddingInline': '4px', height: 18 }}
                  >
                    {line.debit > 0 ? 'DR' : 'CR'}
                  </Chip>
                  <Typography level="body-xs" sx={{ flex: 1, color: 'text.secondary' }}>
                    {line.accountName}
                  </Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {formatInlineCurrency(line.debit > 0 ? line.debit : line.credit)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // Customer card
  if (type === 'customer') {
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.softBg',
              color: 'primary.softColor',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            {entity.name?.charAt(0)?.toUpperCase() || <User size={18} />}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level="title-sm" fontWeight="lg">{entity.name}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.25 }}>
              {entity.email && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Mail size={12} style={{ opacity: 0.5 }} />
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{entity.email}</Typography>
                </Stack>
              )}
              {entity.phone && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Phone size={12} style={{ opacity: 0.5 }} />
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{entity.phone}</Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  // Vendor card
  if (type === 'vendor') {
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 'md',
              bgcolor: 'neutral.softBg',
              color: 'neutral.softColor',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={18} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level="title-sm" fontWeight="lg">{entity.name}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.25 }}>
              {entity.email && (
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{entity.email}</Typography>
              )}
              {entity.paymentTerms && (
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{entity.paymentTerms}</Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  // Invoice card
  if (type === 'invoice') {
    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'overdue' ? 'danger' : entity.status === 'sent' ? 'primary' : 'neutral';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: 'primary.softBg',
                color: 'primary.softColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">
                  {entity.invoiceNumber || 'Draft Invoice'}
                </Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'DRAFT'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.customerName}{entity.dueDate ? ` · Due ${formatInlineDate(entity.dueDate)}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg">
            {formatInlineCurrency(total)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Bill card
  if (type === 'bill') {
    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'overdue' ? 'danger' : 'warning';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: 'warning.softBg',
                color: 'warning.softColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">
                  {entity.billNumber || 'Bill'}
                </Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'UNPAID'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.vendorName}{entity.dueDate ? ` · Due ${formatInlineDate(entity.dueDate)}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg">
            {formatInlineCurrency(total)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Employee card
  if (type === 'employee') {
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'success.softBg',
                color: 'success.softColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              {entity.name?.charAt(0)?.toUpperCase() || <UserCheck size={18} />}
            </Box>
            <Box>
              <Typography level="title-sm" fontWeight="lg">{entity.name}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {[entity.designation, entity.department].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Stack>
          {entity.salary && (
            <Typography level="title-sm" fontWeight="lg">
              {formatInlineCurrency(entity.salary)}<Typography level="body-xs" component="span" sx={{ color: 'text.tertiary' }}>/mo</Typography>
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Account card
  if (type === 'account') {
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: 'primary.softBg',
                color: 'primary.softColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={18} />
            </Box>
            <Box>
              <Typography level="title-sm" fontWeight="lg">{entity.name}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.code ? `${entity.code} · ` : ''}{entity.subtypeCode?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Account'}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg" color="primary">
            {formatInlineCurrency(entity.balance || 0)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Journal Entry card
  if (type === 'journal_entry') {
    const lines = entity.lines || [];
    return (
      <Box
        sx={{
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: 'primary.softBg',
                color: 'primary.softColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </Box>
            <Box>
              <Typography level="title-sm" fontWeight="lg">{entity.entryNumber}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.description}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg" color="primary">
            {formatInlineCurrency(entity.totalDebit || 0)}
          </Typography>
        </Box>
        {lines.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1' }}>
            <Stack spacing={0.5}>
              {lines.map((line: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip size="sm" variant="outlined" color={line.debit > 0 ? 'warning' : 'success'}
                    sx={{ fontSize: '10px', fontWeight: 700, minWidth: 28, justifyContent: 'center', '--Chip-paddingInline': '4px', height: 18 }}>
                    {line.debit > 0 ? 'DR' : 'CR'}
                  </Chip>
                  <Typography level="body-xs" sx={{ flex: 1, color: 'text.secondary' }}>{line.accountName}</Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {formatInlineCurrency(line.debit > 0 ? line.debit : line.credit)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // Quote card
  if (type === 'quote') {
    const statusColor = entity.status === 'accepted' ? 'success' : entity.status === 'declined' ? 'danger' : entity.status === 'expired' ? 'neutral' : 'primary';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg', color: 'primary.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">{entity.quoteNumber || 'Quote'}</Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'DRAFT'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.customerName}{entity.expiryDate ? ` · Expires ${formatInlineDate(entity.expiryDate)}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg">{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Purchase Order card
  if (type === 'purchase_order') {
    const statusColor = entity.status === 'received' ? 'success' : entity.status === 'cancelled' ? 'danger' : entity.status === 'sent' ? 'primary' : 'neutral';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'neutral.softBg', color: 'neutral.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">{entity.poNumber || 'Purchase Order'}</Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'DRAFT'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.vendorName}{entity.expectedDate ? ` · Expected ${formatInlineDate(entity.expectedDate)}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg">{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Credit Note card
  if (type === 'credit_note') {
    const statusColor = entity.status === 'applied' ? 'success' : entity.status === 'cancelled' ? 'danger' : 'warning';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg', color: 'danger.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">{entity.cnNumber || 'Credit Note'}</Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'DRAFT'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.customerName}{entity.reason ? ` · ${entity.reason}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg" color="danger">{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Recurring Transaction card
  if (type === 'recurring_transaction') {
    const isActive = entity.isActive !== false;
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg', color: 'primary.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCcw size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">{entity.name || 'Recurring'}</Typography>
                <Chip size="sm" variant="soft" color={isActive ? 'success' : 'neutral'} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {isActive ? 'ACTIVE' : 'PAUSED'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.frequency?.charAt(0).toUpperCase() + entity.frequency?.slice(1) || ''}{entity.type ? ` · ${entity.type}` : ''}{entity.nextDate ? ` · Next: ${formatInlineDate(entity.nextDate)}` : ''}
              </Typography>
            </Box>
          </Stack>
          {entity.amount && (
            <Typography level="title-md" fontWeight="lg">{formatInlineCurrency(entity.amount)}</Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Bank Account card
  if (type === 'bank_account') {
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg', color: 'primary.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={18} />
            </Box>
            <Box>
              <Typography level="title-sm" fontWeight="lg">{entity.accountName || entity.name}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {[entity.bankName, entity.accountType?.replace(/_/g, ' '), entity.currency].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Stack>
          <Typography level="title-md" fontWeight="lg" color="primary">
            {formatInlineCurrency(entity.balance || 0)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Salary Slip card
  if (type === 'salary_slip') {
    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'cancelled' ? 'danger' : 'neutral';
    return (
      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, bgcolor: 'background.surface' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg', color: 'success.softColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={18} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="title-sm" fontWeight="lg">{entity.employeeName || 'Salary Slip'}</Typography>
                <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {entity.status?.toUpperCase() || 'GENERATED'}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {entity.month && entity.year ? `${new Date(entity.year, entity.month - 1).toLocaleString('en', { month: 'long' })} ${entity.year}` : ''}{entity.designation ? ` · ${entity.designation}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ textAlign: 'right' }}>
            <Typography level="title-md" fontWeight="lg" color="success">
              {formatInlineCurrency(entity.netPay || entity.totalEarnings || entity.salary || 0)}
            </Typography>
            {entity.netPay && entity.totalEarnings && entity.totalEarnings !== entity.netPay && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                Gross: {formatInlineCurrency(entity.totalEarnings)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // Generic fallback — show only clean fields, skip IDs and internal data
  const cleanFields = Object.entries(entity).filter(([key, value]) => {
    if (['id', 'createdAt', 'updatedAt', 'items', 'lines', 'entries', 'companyId', 'userId'].includes(key)) return false;
    if (key.toLowerCase().endsWith('id') && typeof value === 'string' && value.length > 15) return false;
    if (typeof value === 'object') return false;
    if (value === '' || value === null || value === undefined) return false;
    return true;
  });

  if (cleanFields.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        mt: 1,
        bgcolor: 'background.surface',
      }}
    >
      <Stack spacing={1}>
        {cleanFields.slice(0, 6).map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          let displayValue = value;
          if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('salary') ||
              key.toLowerCase().includes('total') || key.toLowerCase().includes('balance')) {
            displayValue = formatInlineCurrency(Number(value));
          } else if (key.toLowerCase().includes('date')) {
            displayValue = formatInlineDate(value);
          }
          return (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{label}</Typography>
              <Typography level="body-sm" fontWeight={500}>{String(displayValue)}</Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function ChatMessage({
  message,
  showTimestamp = true,
  userPhotoUrl,
  userName,
  richData,
  actions,
  followUp,
  onSendMessage,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    entityType: string;
    entity: Record<string, any> | null;
  }>({ open: false, entityType: '', entity: null });

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (action: ActionButton) => {
    // Handle actions that trigger tool calls (send, pay, cancel, etc.)
    if (action.toolCall && action.entityId && onSendMessage) {
      const toolMessages: Record<string, string> = {
        change_invoice_status: `mark invoice ${action.entityId} as sent`,
        mark_invoice_paid: `mark invoice ${action.entityId} as paid`,
        cancel_invoice: `cancel invoice ${action.entityId}`,
        change_bill_status: `mark bill ${action.entityId} as paid`,
      };
      const message = toolMessages[action.toolCall];
      if (message) {
        onSendMessage(message);
      }
      return;
    }

    if (action.type === 'view' && action.data) {
      setViewModal({
        open: true,
        entityType: action.entityType,
        entity: action.data,
      });
    } else if (action.type === 'navigate') {
      // Navigate to the relevant page
      const routes: Record<string, string> = {
        customer: '/customers',
        vendor: '/vendors',
        employee: '/employees',
        invoice: '/invoices',
        bill: '/bills',
        transaction: '/transactions',
        account: '/accounts',
      };
      const route = routes[action.entityType];
      if (route) {
        window.location.href = route;
      }
    } else if (action.type === 'download') {
      // TODO: Implement download functionality
      console.log('Download:', action);
    }
  };

  const handleViewItem = (item: Record<string, any>) => {
    if (richData?.entityType) {
      setViewModal({
        open: true,
        entityType: richData.entityType,
        entity: item,
      });
    }
  };

  // Parse timestamp
  const timestamp = message.createdAt
    ? typeof message.createdAt === 'object' && 'toDate' in message.createdAt
      ? message.createdAt.toDate()
      : new Date(message.createdAt as unknown as string)
    : new Date();

  return (
    <>
      <Box
        sx={{
          maxWidth: 768,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: 2,
          '&:hover .copy-button': {
            opacity: 1,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'flex-start',
          }}
        >
          {/* Avatar */}
          {isUser ? (
            <Avatar
              size="sm"
              src={userPhotoUrl}
              sx={{
                bgcolor: 'primary.500',
                flexShrink: 0,
                width: 32,
                height: 32,
              }}
            >
              {userName?.charAt(0) || <User size={16} />}
            </Avatar>
          ) : (
            <Box sx={{ flexShrink: 0, width: 32, height: 32 }}>
              <AnimatedLogo size="sm" />
            </Box>
          )}

          {/* Message content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Role label */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography level="title-sm" fontWeight="lg">
                {isUser ? (userName || 'You') : 'Flow AI'}
              </Typography>
              {showTimestamp && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  {format(timestamp, 'h:mm a')}
                </Typography>
              )}
            </Stack>

            {/* Content */}
            <Box
              sx={{
                position: 'relative',
                bgcolor: isUser ? 'transparent' : 'background.level1',
                borderRadius: 'lg',
                p: isUser ? 0 : 2,
              }}
            >
              {/* Main message text */}
              {message.content && <RichText content={message.content} />}

              {/* Rich data display */}
              {!isUser && richData && (
                <Box sx={{ mt: message.content ? 2 : 0 }}>
                  {/* Single entity display */}
                  {richData.type === 'entity' && richData.entity && !richData.entities && (
                    <EntityInlineCard entity={richData.entity} entityType={richData.entityType} />
                  )}

                  {/* Multiple entities display */}
                  {richData.type === 'entity' && richData.entities && richData.entities.length > 0 && (
                    <Stack spacing={1}>
                      {richData.entities.map((item, idx) => (
                        <EntityInlineCard key={idx} entity={item.entity} entityType={item.entityType} />
                      ))}
                    </Stack>
                  )}

                  {/* List display with data grid */}
                  {richData.type === 'list' && richData.items && richData.items.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <ChatDataGrid
                        items={richData.items}
                        columns={richData.columns || []}
                        entityType={richData.entityType || 'item'}
                        pagination={richData.pagination}
                        onViewItem={handleViewItem}
                      />
                    </Box>
                  )}

                  {/* Dashboard Summary display */}
                  {richData.type === 'summary' && richData.summary && (() => {
                    const s = richData.summary;
                    const net = Number(s.net) || 0;
                    const netColor = net >= 0 ? 'success' : 'danger';
                    const NetIcon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
                    return (
                      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5, bgcolor: 'primary.softBg' }}>
                          <BarChart3 size={16} />
                          <Typography level="title-sm" fontWeight={700}>Dashboard Summary</Typography>
                          {s.period && (
                            <Chip size="sm" variant="soft" color="neutral" sx={{ ml: 'auto', fontSize: '10px' }}>
                              {String(s.period)}
                            </Chip>
                          )}
                        </Box>

                        {/* KPI Row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Income</Typography>
                            <Typography level="title-sm" fontWeight={700} color="success">${Number(s.income || 0).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Expenses</Typography>
                            <Typography level="title-sm" fontWeight={700} color="danger">${Number(s.expenses || 0).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Net</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                              <NetIcon size={14} />
                              <Typography level="title-sm" fontWeight={700} color={netColor}>${Math.abs(net).toLocaleString()}</Typography>
                            </Stack>
                          </Box>
                        </Box>

                        {/* Overview Row */}
                        <Box sx={{ display: 'flex', gap: 2, px: 2.5, py: 1.5, bgcolor: 'background.surface' }}>
                          {s.customerCount != null && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Users size={13} style={{ opacity: 0.5 }} />
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{s.customerCount} Customers</Typography>
                            </Stack>
                          )}
                          {s.vendorCount != null && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Store size={13} style={{ opacity: 0.5 }} />
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{s.vendorCount} Vendors</Typography>
                            </Stack>
                          )}
                          {s.openInvoices != null && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <ClipboardList size={13} style={{ opacity: 0.5 }} />
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{s.openInvoices} Open Invoices</Typography>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    );
                  })()}

                  {/* Report display */}
                  {richData.type === 'report' && richData.summary && (() => {
                    const s = richData.summary;
                    const net = Number(s.net) || 0;
                    const netColor = net >= 0 ? 'success' : 'danger';
                    const NetIcon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
                    const categories = s.categories as Record<string, number> | undefined;
                    const hasCategories = categories && Object.keys(categories).length > 0;
                    const maxCategoryAmount = hasCategories ? Math.max(...Object.values(categories)) : 0;

                    return (
                      <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 1 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5, bgcolor: 'primary.softBg' }}>
                          <PieChart size={16} />
                          <Box sx={{ flex: 1 }}>
                            <Typography level="title-sm" fontWeight={700}>{s.reportName || 'Financial Report'}</Typography>
                            {s.period && (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{String(s.period)}</Typography>
                            )}
                          </Box>
                          <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px' }}>
                            {s.transactionCount || 0} transactions
                          </Chip>
                        </Box>

                        {/* KPI Row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Income</Typography>
                            <Typography level="title-sm" fontWeight={700} color="success">${Number(s.income || 0).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Expenses</Typography>
                            <Typography level="title-sm" fontWeight={700} color="danger">${Number(s.expenses || 0).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Net</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                              <NetIcon size={14} />
                              <Typography level="title-sm" fontWeight={700} color={netColor}>
                                {net < 0 ? '-' : ''}${Math.abs(net).toLocaleString()}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>

                        {/* Categories Breakdown */}
                        {hasCategories && (
                          <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'background.level1' }}>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px', mb: 1 }}>
                              By Category
                            </Typography>
                            <Stack spacing={0.75}>
                              {Object.entries(categories)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, amt]) => (
                                  <Box key={cat}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{cat}</Typography>
                                      <Typography level="body-xs" fontWeight={600}>${Number(amt).toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ height: 3, bgcolor: 'neutral.100', borderRadius: 2, overflow: 'hidden' }}>
                                      <Box sx={{ height: '100%', width: `${(amt / maxCategoryAmount) * 100}%`, bgcolor: 'warning.400', borderRadius: 2 }} />
                                    </Box>
                                  </Box>
                                ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              )}

              {/* Action buttons */}
              {!isUser && actions && actions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <ChatActionButtons actions={actions} onAction={handleAction} />
                </Box>
              )}

              {/* Follow-up suggestion */}
              {!isUser && followUp && (
                <Typography
                  level="body-sm"
                  sx={{
                    mt: 2,
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                >
                  {followUp}
                </Typography>
              )}

              {/* Copy button - only for assistant messages */}
              {!isUser && (
                <Box
                  className="copy-button"
                  onClick={handleCopy}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                    p: 0.5,
                    borderRadius: 'sm',
                    '&:hover': {
                      bgcolor: 'background.level2',
                    },
                  }}
                >
                  {copied ? (
                    <Check size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Entity detail modal */}
      <EntityDetailModal
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, entityType: '', entity: null })}
        entityType={viewModal.entityType}
        entity={viewModal.entity}
      />
    </>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <Box
      sx={{
        maxWidth: 768,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ flexShrink: 0, width: 32, height: 32 }}>
          <AnimatedLogo size="sm" isResponding />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography level="title-sm" fontWeight="lg" sx={{ mb: 0.5 }}>
            Flow AI
          </Typography>
          <Box
            sx={{
              bgcolor: 'background.level1',
              borderRadius: 'lg',
              p: 2,
              display: 'inline-flex',
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.400',
                    animation: 'typing 1.4s infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes typing': {
                      '0%, 60%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                      '30%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
