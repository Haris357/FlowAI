'use client';

import { useState } from 'react';
import { Box, Stack, Typography, Avatar, Divider, Chip, Modal, ModalDialog, ModalClose, Textarea, Button } from '@mui/joy';
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
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage as ChatMessageType } from '@/types';
import { RichResponse, ActionButton } from '@/lib/ai-config';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
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
  onExecuteToolAction?: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => void;
}

// Parse {{BUTTONS:...}} tags from message content
function parseSuggestions(content: string): { text: string; suggestions: string[][] } {
  const suggestions: string[][] = [];
  // Match all {{BUTTONS:opt1|opt2|opt3}} patterns
  const text = content.replace(/\{\{BUTTONS:(.*?)\}\}/g, (_match, opts: string) => {
    const options = opts.split('|').map((o: string) => o.trim()).filter(Boolean);
    if (options.length > 0) suggestions.push(options);
    return '';
  }).trim();
  return { text, suggestions };
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
        lineHeight: 1.6,
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

// Inline suggestion buttons — persists selection across page reloads
function SuggestionButtons({
  suggestions,
  onSelect,
  persistedSelection,
  messageId,
  companyId,
  chatId,
}: {
  suggestions: string[][];
  onSelect: (text: string) => void;
  persistedSelection?: string;
  messageId?: string;
  companyId?: string;
  chatId?: string;
}) {
  const [selected, setSelected] = useState<string | null>(persistedSelection || null);

  if (suggestions.length === 0) return null;

  const handleSelect = async (option: string) => {
    if (selected) return;
    setSelected(option);
    onSelect(option);
    // Persist to Firestore so it stays hidden after refresh
    if (companyId && chatId && messageId && !messageId.startsWith('temp-')) {
      import('@/services/chats').then(({ updateMessageSelectedSuggestion }) => {
        updateMessageSelectedSuggestion(companyId, chatId, messageId, option).catch(() => {});
      });
    }
  };

  // If already selected (from persistence), only show the selected one
  if (selected) {
    return (
      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'primary.plainColor',
              bgcolor: 'primary.softBg',
              opacity: 0.7,
            }}
          >
            <Check size={14} />
            {selected}
          </Box>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
      {suggestions.map((group, gi) => (
        <Stack key={gi} direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {group.map((option, oi) => (
            <Box
              key={oi}
              onClick={() => handleSelect(option)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'neutral.outlinedBorder',
                color: 'text.primary',
                bgcolor: 'background.surface',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                '&:hover': {
                  borderColor: 'primary.400',
                  bgcolor: 'primary.softBg',
                  color: 'primary.plainColor',
                },
                '&:active': {
                  transform: 'scale(0.97)',
                },
              }}
            >
              {option}
            </Box>
          ))}
        </Stack>
      ))}
    </Stack>
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
    const isPayment = entity.type === 'payment_received' || entity.type === 'payment_made';
    const accentColor = isExpense ? 'danger' : isPayment ? 'primary' : 'success';
    const journalLines = entity.journalLines as { accountName: string; accountCode?: string; debit: number; credit: number }[] | undefined;
    const metaParts = [
      entity.date ? formatInlineDate(entity.date) : null,
      entity.category || null,
      entity.paymentMethod ? entity.paymentMethod.replace(/_/g, ' ') : null,
    ].filter(Boolean);

    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          mt: 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.400' },
        }}
      >
        {/* Main row */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Accent bar */}
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: `${accentColor}.500` }} />
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>
                {entity.description || 'Transaction'}
              </Typography>
              <Chip
                size="sm"
                variant="soft"
                color={accentColor}
                sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}
              >
                {entity.type?.replace(/_/g, ' ').toUpperCase() || 'EXPENSE'}
              </Chip>
            </Stack>
            {metaParts.length > 0 && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                {metaParts.join(' · ')}
              </Typography>
            )}
          </Box>
          {/* Amount */}
          <Typography
            level="body-md"
            fontWeight={700}
            sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', color: isExpense ? 'danger.500' : 'success.600' }}
          >
            {isExpense ? '-' : '+'}{formatInlineCurrency(entity.amount)}
          </Typography>
        </Box>

        {/* Journal entry — compact */}
        {journalLines && journalLines.length > 0 && (
          <Box sx={{ px: 2, pb: 1.5, borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px', mb: 0.75 }}>
              Journal Entry
            </Typography>
            <Stack spacing={0.4}>
              {journalLines.map((line, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={0.75}>
                  <Typography
                    sx={{
                      fontSize: '10px', fontWeight: 700, color: line.debit > 0 ? 'danger.500' : 'success.600',
                      minWidth: 18, letterSpacing: '0.02em',
                    }}
                  >
                    {line.debit > 0 ? 'DR' : 'CR'}
                  </Typography>
                  <Typography level="body-xs" sx={{ flex: 1, color: 'text.secondary' }} noWrap>
                    {line.accountName}
                  </Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                    {formatInlineCurrency(line.debit > 0 ? line.debit : line.credit)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // Customer card
  if (type === 'customer') {
    const metaParts = [entity.email, entity.phone].filter(Boolean);
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          mt: 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.400' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Left accent bar */}
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: 'primary.400' }} />
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>
                {entity.name}
              </Typography>
              <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>
                CUSTOMER
              </Chip>
            </Stack>
            {metaParts.length > 0 && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                {metaParts.join(' · ')}
              </Typography>
            )}
          </Box>
          {/* Avatar initial */}
          <Box sx={{
            width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.softBg', color: 'primary.softColor',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0,
          }}>
            {entity.name?.charAt(0)?.toUpperCase() || <User size={14} />}
          </Box>
        </Box>
      </Box>
    );
  }

  // Vendor card
  if (type === 'vendor') {
    const metaParts = [entity.email, entity.paymentTerms, entity.creditLimit ? `Credit $${entity.creditLimit}` : null].filter(Boolean);
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          mt: 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.400' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Left accent bar */}
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: 'neutral.400' }} />
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>
                {entity.name}
              </Typography>
              <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>
                VENDOR
              </Chip>
            </Stack>
            {metaParts.length > 0 && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                {metaParts.join(' · ')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // Invoice card — clean, modern design
  if (type === 'invoice') {
    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'overdue' ? 'danger' : entity.status === 'sent' ? 'primary' : 'neutral';
    const statusLabel = entity.status?.toUpperCase() || 'DRAFT';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    const dueText = entity.dueDate ? `Due ${formatInlineDate(entity.dueDate)}` : '';
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          mt: 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.400' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Left accent bar */}
          <Box sx={{
            width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
            bgcolor: statusColor === 'neutral' ? 'neutral.400' : `${statusColor}.500`,
          }} />
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>
                {entity.invoiceNumber || 'Draft Invoice'}
              </Typography>
              <Chip
                size="sm"
                variant="soft"
                color={statusColor}
                sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}
              >
                {statusLabel}
              </Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {entity.customerName}{dueText ? ` \u00B7 ${dueText}` : ''}
            </Typography>
          </Box>
          {/* Amount */}
          <Typography level="body-md" fontWeight={700} sx={{ color: 'text.primary', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {formatInlineCurrency(total)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Bill card — matches invoice style
  if (type === 'bill') {
    const statusColor: 'success' | 'danger' | 'warning' | 'neutral' = entity.status === 'paid' ? 'success' : entity.status === 'overdue' ? 'danger' : 'warning';
    const statusLabel = entity.status?.toUpperCase() || 'UNPAID';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    const dueText = entity.dueDate ? `Due ${formatInlineDate(entity.dueDate)}` : '';
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          mt: 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.400' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
            bgcolor: `${statusColor}.500`,
          }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>
                {entity.billNumber || 'Bill'}
              </Typography>
              <Chip
                size="sm"
                variant="soft"
                color={statusColor}
                sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}
              >
                {statusLabel}
              </Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {entity.vendorName}{dueText ? ` \u00B7 ${dueText}` : ''}
            </Typography>
          </Box>
          <Typography level="body-md" fontWeight={700} sx={{ color: 'text.primary', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
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
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: `${statusColor}.500` }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.quoteNumber || 'Quote'}</Typography>
              <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>{entity.status?.toUpperCase() || 'DRAFT'}</Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {entity.customerName}{entity.expiryDate ? ` · Expires ${formatInlineDate(entity.expiryDate)}` : ''}
            </Typography>
          </Box>
          <Typography level="body-md" fontWeight={700} sx={{ color: 'text.primary', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Purchase Order card
  if (type === 'purchase_order') {
    const statusColor = entity.status === 'received' ? 'success' : entity.status === 'cancelled' ? 'danger' : entity.status === 'sent' ? 'primary' : 'neutral';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: statusColor === 'neutral' ? 'neutral.400' : `${statusColor}.500` }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.poNumber || 'Purchase Order'}</Typography>
              <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>{entity.status?.toUpperCase() || 'DRAFT'}</Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {entity.vendorName}{entity.expectedDate ? ` · Expected ${formatInlineDate(entity.expectedDate)}` : ''}
            </Typography>
          </Box>
          <Typography level="body-md" fontWeight={700} sx={{ color: 'text.primary', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Credit Note card
  if (type === 'credit_note') {
    const statusColor = entity.status === 'applied' ? 'success' : entity.status === 'cancelled' ? 'danger' : 'warning';
    const total = entity.total || entity.items?.reduce((s: number, i: any) => s + ((i.quantity || 1) * (i.rate || 0)), 0) || 0;
    return (
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: `${statusColor}.500` }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.cnNumber || 'Credit Note'}</Typography>
              <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>{entity.status?.toUpperCase() || 'DRAFT'}</Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {entity.customerName}{entity.reason ? ` · ${entity.reason}` : ''}
            </Typography>
          </Box>
          <Typography level="body-md" fontWeight={700} sx={{ color: 'danger.500', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatInlineCurrency(total)}</Typography>
        </Box>
      </Box>
    );
  }

  // Recurring Transaction card
  if (type === 'recurring_transaction') {
    const isActive = entity.isActive !== false;
    return (
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: isActive ? 'success.500' : 'neutral.400' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.name || 'Recurring'}</Typography>
              <Chip size="sm" variant="soft" color={isActive ? 'success' : 'neutral'} sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>{isActive ? 'ACTIVE' : 'PAUSED'}</Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {[entity.frequency ? entity.frequency.charAt(0).toUpperCase() + entity.frequency.slice(1) : null, entity.type, entity.nextDate ? `Next: ${formatInlineDate(entity.nextDate)}` : null].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          {entity.amount && (
            <Typography level="body-md" fontWeight={700} sx={{ color: 'text.primary', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatInlineCurrency(entity.amount)}</Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Bank Account card
  if (type === 'bank_account') {
    return (
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: 'primary.400' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.accountName || entity.name}</Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {[entity.bankName, entity.accountType?.replace(/_/g, ' '), entity.currency].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Typography level="body-md" fontWeight={700} sx={{ color: 'primary.600', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {formatInlineCurrency(entity.balance || 0)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Salary Slip card
  if (type === 'salary_slip') {
    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'cancelled' ? 'danger' : 'neutral';
    const gross = entity.totalEarnings || entity.salary || 0;
    const net = entity.netPay || gross;
    return (
      <Box sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.surface', overflow: 'hidden', mt: 1, transition: 'border-color 0.15s', '&:hover': { borderColor: 'neutral.400' } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, bgcolor: 'success.500' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.primary' }} noWrap>{entity.employeeName || 'Salary Slip'}</Typography>
              <Chip size="sm" variant="soft" color={statusColor} sx={{ fontSize: '10px', fontWeight: 700, height: 18, '--Chip-paddingInline': '6px' }}>{entity.status?.toUpperCase() || 'GENERATED'}</Chip>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {[entity.month && entity.year ? `${new Date(entity.year, entity.month - 1).toLocaleString('en', { month: 'long' })} ${entity.year}` : null, entity.designation].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography level="body-md" fontWeight={700} sx={{ color: 'success.600', fontVariantNumeric: 'tabular-nums' }}>{formatInlineCurrency(net)}</Typography>
            {net !== gross && gross > 0 && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Gross {formatInlineCurrency(gross)}</Typography>
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
  onExecuteToolAction,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [clickedToolActions, setClickedToolActions] = useState<Set<string>>(
    new Set(message.completedActions || [])
  );
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    entityType: string;
    entity: Record<string, any> | null;
  }>({ open: false, entityType: '', entity: null });
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { company } = useCompany();
  const { user } = useAuth();
  const chatCtx = useChat();
  const { currentSessionId } = chatCtx;

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: 'like' | 'dislike') => {
    if (feedback === rating) return; // Already selected
    setFeedback(rating);

    if (rating === 'dislike') {
      setShowComplaintModal(true);
      return;
    }

    // Like — submit immediately
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || '',
          companyId: company?.id || '',
          chatId: currentSessionId || '',
          messageId: message.id,
          userMessage: '',
          aiResponse: message.content,
          rating: 'like',
          complaint: '',
        }),
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleSubmitComplaint = async () => {
    setSubmittingFeedback(true);
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || '',
          companyId: company?.id || '',
          chatId: currentSessionId || '',
          messageId: message.id,
          userMessage: '',
          aiResponse: message.content,
          rating: 'dislike',
          complaint: complaint.trim(),
        }),
      });
      setShowComplaintModal(false);
      setComplaint('');
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCloseComplaint = () => {
    setShowComplaintModal(false);
    // If they close without submitting, still record the dislike
    fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.uid || '',
        companyId: company?.id || '',
        chatId: currentSessionId || '',
        messageId: message.id,
        userMessage: '',
        aiResponse: message.content,
        rating: 'dislike',
        complaint: '',
      }),
    }).catch(() => {});
  };

  const handleAction = (action: ActionButton) => {
    // Handle actions that trigger tool calls (send, pay, cancel, etc.)
    if (action.toolCall && action.entityId) {
      // Prevent duplicate clicks
      const key = `${action.toolCall}-${action.entityId}`;
      if (clickedToolActions.has(key)) return;
      setClickedToolActions(prev => new Set(prev).add(key));

      // Build tool args based on the tool name
      const toolArgs: Record<string, Record<string, any>> = {
        send_invoice: { invoiceId: action.entityId },
        change_invoice_status: { invoiceId: action.entityId, newStatus: 'sent' },
        mark_invoice_paid: { invoiceId: action.entityId, newStatus: 'paid' },
        cancel_invoice: { invoiceId: action.entityId, newStatus: 'cancelled' },
        change_bill_status: { billId: action.entityId, newStatus: 'paid' },
      };
      const args = toolArgs[action.toolCall] || { id: action.entityId };

      // Execute tool directly — no AI round-trip, pass message ID for persistence
      if (onExecuteToolAction) {
        onExecuteToolAction(action.toolCall, args, message.id, key);
      }
      return;
    }

    if (action.type === 'view' && action.data) {
      setViewModal({
        open: true,
        entityType: action.entityType as string,
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
      const route = routes[action.entityType ?? ''];
      if (route) {
        window.location.href = route;
      }
    } else if (action.type === 'download' && action.entityType === 'invoice' && action.entityId) {
      // Download invoice PDF
      const companyId = company?.id;
      if (companyId) {
        window.open(`/api/invoices/pdf?companyId=${companyId}&invoiceId=${action.entityId}`, '_blank');
      }
    } else if (action.type === 'download' && action.entityType === 'salary_slip' && action.entityId) {
      // Download salary slip PDF
      const companyId = company?.id;
      if (companyId) {
        window.open(`/api/payroll/pdf?companyId=${companyId}&slipId=${action.entityId}`, '_blank');
      }
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
          px: { xs: 1.5, sm: 2.5 },
          py: 0.5,
          '&:hover .msg-actions': {
            opacity: 1,
          },
        }}
      >
        {isUser ? (
          /* ===== USER MESSAGE — Right aligned bubble ===== */
          <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="flex-end">
            <Box sx={{ maxWidth: '75%' }}>
              {showTimestamp && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'right', mb: 0.25, mr: 0.5, fontSize: '11px' }}>
                  {format(timestamp, 'h:mm a')}
                </Typography>
              )}
              <Box
                sx={{
                  bgcolor: '#D97757',
                  color: '#fff',
                  borderRadius: '16px 16px 4px 16px',
                  px: 2.5,
                  py: 1.25,
                }}
              >
                {/* Show message text only if it's not just "Attached ..." auto-text */}
                {message.content && !(message.attachments && message.attachments.length > 0 && message.content.startsWith('Attached ')) && (
                  <Typography
                    level="body-md"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      color: 'inherit',
                    }}
                  >
                    {message.content}
                  </Typography>
                )}
                {/* Attachment chips in user message */}
                {message.attachments && message.attachments.length > 0 && (
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {message.attachments.map((att) => (
                      <Chip
                        key={att.id}
                        size="sm"
                        variant="soft"
                        sx={(theme) => ({
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'primary.softBg',
                          color: theme.palette.mode === 'dark' ? '#fff' : 'primary.plainColor',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.28)' : 'primary.softHoverBg',
                          },
                        })}
                        startDecorator={<FileText size={13} />}
                        onClick={() => window.open(att.url, '_blank')}
                      >
                        {att.name}
                      </Chip>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </Stack>
        ) : (
          /* ===== AI MESSAGE — Clean layout, no avatar (shown once below) ===== */
          <Box>
              <Box sx={{ position: 'relative' }}>
              {/* Main message text + inline suggestion buttons */}
              {message.content && (() => {
                const { text, suggestions } = parseSuggestions(message.content);
                return (
                  <>
                    {text && <RichText content={text} />}
                    {!isUser && suggestions.length > 0 && onSendMessage && (
                      <SuggestionButtons
                        suggestions={suggestions}
                        onSelect={onSendMessage}
                        persistedSelection={message.selectedSuggestion}
                        messageId={message.id}
                        companyId={company?.id}
                        chatId={currentSessionId || undefined}
                      />
                    )}
                  </>
                );
              })()}

              {/* Rich data display — supports multiple blocks (entity + list + summary in one message) */}
              {!isUser && (() => {
                const dataBlocks = message.richDataList || (richData ? [richData] : []);
                if (dataBlocks.length === 0) return null;
                return (
                  <Box sx={{ mt: message.content ? 2 : 0 }}>
                    <Stack spacing={2}>
                      {dataBlocks.map((rd, blockIdx) => (
                        <Box key={blockIdx}>
                          {/* Single entity display */}
                          {rd.type === 'entity' && rd.entity && !rd.entities && (
                            <EntityInlineCard entity={rd.entity} entityType={rd.entityType} />
                          )}

                          {/* Multiple entities display — each card with inline actions */}
                          {rd.type === 'entity' && rd.entities && rd.entities.length > 0 && (
                            <Stack spacing={0.75}>
                              {rd.entities.map((item, idx) => (
                                <Stack key={idx} direction="row" alignItems="stretch" spacing={0.75}>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <EntityInlineCard entity={item.entity} entityType={item.entityType} />
                                  </Box>
                                  {item.actions && item.actions.length > 0 && (
                                    <Stack direction="row" alignItems="center">
                                      <ChatActionButtons
                                        actions={item.actions}
                                        onAction={handleAction}
                                        compact
                                        disabledActions={clickedToolActions}
                                      />
                                    </Stack>
                                  )}
                                </Stack>
                              ))}
                            </Stack>
                          )}

                          {/* List display with data grid */}
                          {rd.type === 'list' && rd.items && rd.items.length > 0 && (
                            <Box>
                              <ChatDataGrid
                                items={rd.items}
                                columns={rd.columns || []}
                                entityType={rd.entityType || 'item'}
                                pagination={rd.pagination}
                                onViewItem={handleViewItem}
                              />
                            </Box>
                          )}

                          {/* Dashboard Summary display */}
                          {rd.type === 'summary' && rd.summary && (() => {
                            const s = rd.summary;
                            const net = Number(s.net) || 0;
                            const netColor = net >= 0 ? 'success' : 'danger';
                            const NetIcon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
                            return (
                              <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5, bgcolor: 'primary.softBg' }}>
                                  <BarChart3 size={16} />
                                  <Typography level="title-sm" fontWeight={700}>Dashboard Summary</Typography>
                                  {s.period && (
                                    <Chip size="sm" variant="soft" color="neutral" sx={{ ml: 'auto', fontSize: '10px' }}>
                                      {String(s.period)}
                                    </Chip>
                                  )}
                                </Box>
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
                          {rd.type === 'report' && rd.summary && (() => {
                            const s = rd.summary;
                            const net = Number(s.net) || 0;
                            const netColor = net >= 0 ? 'success' : 'danger';
                            const NetIcon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
                            const categories = s.categories as Record<string, number> | undefined;
                            const hasCategories = categories && Object.keys(categories).length > 0;
                            const maxCategoryAmount = hasCategories ? Math.max(...Object.values(categories)) : 0;

                            return (
                              <Box sx={{ borderRadius: 'lg', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
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
                      ))}
                    </Stack>
                  </Box>
                );
              })()}

              {/* Action buttons */}
              {!isUser && actions && actions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <ChatActionButtons actions={actions} onAction={handleAction} disabledActions={clickedToolActions} />
                </Box>
              )}

              {/* Follow-up suggestion */}
              {!isUser && followUp && (
                <Typography
                  level="body-xs"
                  sx={{
                    mt: 1.5,
                    color: 'text.tertiary',
                    fontStyle: 'italic',
                  }}
                >
                  {followUp}
                </Typography>
              )}

              {/* "Process All Entries" button — shown on document analysis messages with pending entries */}
              {!isUser && richData?.type === 'list' && richData?.summary?.count > 0 && (() => {
                const { pendingDocumentEntries, processAllDocumentEntries, isSendingMessage } = chatCtx;
                if (pendingDocumentEntries.length === 0) return null;
                const entryTypes = new Set(pendingDocumentEntries.map((e: any) => e.type));
                const typeLabels: Record<string, string> = {
                  invoice: 'invoices', bill: 'bills', expense: 'expenses',
                  journal_entry: 'journal entries', customer: 'customers', vendor: 'vendors', payment: 'payments',
                };
                const typeSummary = Array.from(entryTypes).map((t: string) => {
                  const count = pendingDocumentEntries.filter((e: any) => e.type === t).length;
                  return `${count} ${typeLabels[t] || t}`;
                }).join(', ');

                return (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      disabled={isSendingMessage}
                      onClick={() => processAllDocumentEntries()}
                      sx={{
                        borderRadius: '20px',
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.75,
                        fontSize: '13px',
                        boxShadow: 'sm',
                        '&:hover': { boxShadow: 'md' },
                        '&.Mui-disabled': {
                          opacity: 0.5,
                          bgcolor: 'primary.500',
                          color: '#fff',
                        },
                      }}
                    >
                      Process all entries ({typeSummary})
                    </Button>
                  </Box>
                );
              })()}

              </Box>

              {/* Action bar: copy + like/dislike */}
              <Stack
                direction="row"
                spacing={0.5}
                className="msg-actions"
                sx={{
                  mt: 0.5,
                  ml: 0.25,
                  opacity: feedback ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Box
                  onClick={handleCopy}
                  sx={{
                    cursor: 'pointer',
                    p: 0.5,
                    borderRadius: 'sm',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'background.level2' },
                  }}
                >
                  {copied ? (
                    <Check size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                  )}
                </Box>
                <Box
                  onClick={() => handleFeedback('like')}
                  sx={{
                    cursor: feedback === 'like' ? 'default' : 'pointer',
                    p: 0.5,
                    borderRadius: 'sm',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': feedback !== 'like' ? { bgcolor: 'background.level2' } : {},
                  }}
                >
                  <ThumbsUp
                    size={16}
                    fill={feedback === 'like' ? 'var(--joy-palette-success-500)' : 'none'}
                    style={{ color: feedback === 'like' ? 'var(--joy-palette-success-500)' : 'var(--joy-palette-text-tertiary)' }}
                  />
                </Box>
                <Box
                  onClick={() => handleFeedback('dislike')}
                  sx={{
                    cursor: feedback === 'dislike' ? 'default' : 'pointer',
                    p: 0.5,
                    borderRadius: 'sm',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': feedback !== 'dislike' ? { bgcolor: 'background.level2' } : {},
                  }}
                >
                  <ThumbsDown
                    size={16}
                    fill={feedback === 'dislike' ? 'var(--joy-palette-danger-500)' : 'none'}
                    style={{ color: feedback === 'dislike' ? 'var(--joy-palette-danger-500)' : 'var(--joy-palette-text-tertiary)' }}
                  />
                </Box>
              </Stack>
          </Box>
        )}
      </Box>

      {/* Complaint modal for dislike feedback */}
      <Modal open={showComplaintModal} onClose={handleCloseComplaint}>
        <ModalDialog
          sx={{
            maxWidth: 440,
            borderRadius: 'lg',
            p: 2.5,
          }}
        >
          <ModalClose />
          <Typography level="title-md" fontWeight="lg" sx={{ mb: 0.5 }}>
            What went wrong?
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>
            Help us improve by telling us what was wrong with this response.
          </Typography>
          <Textarea
            placeholder="Describe the issue with this response..."
            minRows={3}
            maxRows={6}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="plain"
              color="neutral"
              size="sm"
              onClick={handleCloseComplaint}
            >
              Skip
            </Button>
            <Button
              size="sm"
              loading={submittingFeedback}
              onClick={handleSubmitComplaint}
              sx={{
                bgcolor: '#D97757',
                '&:hover': { bgcolor: '#c4684a' },
              }}
            >
              Submit
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

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

