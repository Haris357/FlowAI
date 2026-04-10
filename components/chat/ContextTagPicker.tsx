'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/joy';
import {
  Calendar, Clock, AlertCircle, CheckCircle, TrendingUp, TrendingDown,
  BarChart3, ShieldCheck, AlignLeft, Activity, Scale, HelpCircle,
  CalendarDays, Zap, Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TagCategory = 'time' | 'status' | 'mode' | 'scope';

export interface ContextTag {
  id: string;
  trigger: string;       // text after `#` that matches
  label: string;
  description: string;
  icon: LucideIcon;
  category: TagCategory;
  /** Injected into message as context prefix */
  context: string;
}

const CATEGORY_META: Record<TagCategory, { label: string; color: string }> = {
  time:   { label: 'Time Period', color: 'var(--joy-palette-primary-500)' },
  status: { label: 'Status Filter', color: 'var(--joy-palette-warning-500)' },
  mode:   { label: 'AI Mode', color: 'var(--joy-palette-success-500)' },
  scope:  { label: 'Scope', color: 'var(--joy-palette-neutral-500)' },
};

const CATEGORY_ORDER: TagCategory[] = ['time', 'status', 'mode', 'scope'];

export const CONTEXT_TAGS: ContextTag[] = [
  // ─── TIME ──────────────────────────────────────────────────────────────────
  {
    id: 'today', trigger: 'today',
    label: 'Today', description: 'Scope to today only',
    icon: Clock, category: 'time',
    context: '[Time scope: today only]',
  },
  {
    id: 'thisweek', trigger: 'thisweek',
    label: 'This Week', description: 'Scope to current week',
    icon: Calendar, category: 'time',
    context: '[Time scope: this week]',
  },
  {
    id: 'thismonth', trigger: 'thismonth',
    label: 'This Month', description: 'Scope to current calendar month',
    icon: CalendarDays, category: 'time',
    context: '[Time scope: this month]',
  },
  {
    id: 'lastmonth', trigger: 'lastmonth',
    label: 'Last Month', description: 'Scope to previous calendar month',
    icon: CalendarDays, category: 'time',
    context: '[Time scope: last month]',
  },
  {
    id: 'q1', trigger: 'q1', label: 'Q1', description: 'January – March',
    icon: BarChart3, category: 'time',
    context: '[Time scope: Q1 (January–March)]',
  },
  {
    id: 'q2', trigger: 'q2', label: 'Q2', description: 'April – June',
    icon: BarChart3, category: 'time',
    context: '[Time scope: Q2 (April–June)]',
  },
  {
    id: 'q3', trigger: 'q3', label: 'Q3', description: 'July – September',
    icon: BarChart3, category: 'time',
    context: '[Time scope: Q3 (July–September)]',
  },
  {
    id: 'q4', trigger: 'q4', label: 'Q4', description: 'October – December',
    icon: BarChart3, category: 'time',
    context: '[Time scope: Q4 (October–December)]',
  },
  {
    id: 'thisyear', trigger: 'thisyear', aliases: ['ytd'],
    label: 'This Year / YTD', description: 'Year to date',
    icon: TrendingUp, category: 'time',
    context: '[Time scope: this year / year-to-date]',
  },
  {
    id: 'lastyear', trigger: 'lastyear',
    label: 'Last Year', description: 'Previous full year',
    icon: TrendingDown, category: 'time',
    context: '[Time scope: last year]',
  },

  // ─── STATUS ────────────────────────────────────────────────────────────────
  {
    id: 'overdue', trigger: 'overdue',
    label: 'Overdue', description: 'Focus on overdue items only',
    icon: AlertCircle, category: 'status',
    context: '[Filter: overdue items only]',
  },
  {
    id: 'unpaid', trigger: 'unpaid',
    label: 'Unpaid', description: 'Focus on unpaid invoices/bills',
    icon: Clock, category: 'status',
    context: '[Filter: unpaid status only]',
  },
  {
    id: 'paid', trigger: 'paid',
    label: 'Paid', description: 'Focus on paid items',
    icon: CheckCircle, category: 'status',
    context: '[Filter: paid status only]',
  },
  {
    id: 'draft', trigger: 'draft',
    label: 'Draft', description: 'Focus on draft items',
    icon: AlignLeft, category: 'status',
    context: '[Filter: draft status only]',
  },
  {
    id: 'outstanding', trigger: 'outstanding',
    label: 'Outstanding', description: 'Items with outstanding balances',
    icon: TrendingDown, category: 'status',
    context: '[Filter: items with outstanding balances]',
  },

  // ─── AI MODES ──────────────────────────────────────────────────────────────
  {
    id: 'audit-ready', trigger: 'audit',
    label: 'Audit Ready', description: 'Formal, precise, citation-heavy answers',
    icon: ShieldCheck, category: 'mode',
    context: '[Mode: audit-ready — be formal, precise, cite exact figures]',
  },
  {
    id: 'brief', trigger: 'brief',
    label: 'Brief', description: 'Short, to-the-point answers only',
    icon: AlignLeft, category: 'mode',
    context: '[Mode: brief — answer in 2-3 sentences max]',
  },
  {
    id: 'analysis', trigger: 'analysis',
    label: 'Deep Analysis', description: 'Detailed financial analysis with insights',
    icon: Activity, category: 'mode',
    context: '[Mode: deep analysis — provide detailed insights, trends, and recommendations]',
  },
  {
    id: 'simple', trigger: 'simple',
    label: 'Simple Language', description: 'Explain for non-accountants',
    icon: HelpCircle, category: 'mode',
    context: '[Mode: plain language — explain as if to a non-accountant, no jargon]',
  },
  {
    id: 'advisor', trigger: 'advisor',
    label: 'Advisor Mode', description: 'Strategic business advice',
    icon: Zap, category: 'mode',
    context: '[Mode: business advisor — focus on strategic recommendations and actionable advice]',
  },
  {
    id: 'reconcile', trigger: 'reconcile',
    label: 'Reconciliation', description: 'Focus on reconciliation tasks',
    icon: Scale, category: 'mode',
    context: '[Mode: reconciliation — focus on matching, discrepancies, and balance verification]',
  },

  // ─── SCOPE ─────────────────────────────────────────────────────────────────
  {
    id: 'customers-only', trigger: 'customers',
    label: 'Customers Scope', description: 'Only look at customer data',
    icon: Filter, category: 'scope',
    context: '[Scope: customers only]',
  },
  {
    id: 'vendors-only', trigger: 'vendors',
    label: 'Vendors Scope', description: 'Only look at vendor data',
    icon: Filter, category: 'scope',
    context: '[Scope: vendors only]',
  },
  {
    id: 'invoices-only', trigger: 'invoices',
    label: 'Invoices Scope', description: 'Only look at invoice data',
    icon: Filter, category: 'scope',
    context: '[Scope: invoices only]',
  },
  {
    id: 'expenses-only', trigger: 'expenses',
    label: 'Expenses Scope', description: 'Only look at expense data',
    icon: Filter, category: 'scope',
    context: '[Scope: expenses only]',
  },
];

function searchTags(query: string): ContextTag[] {
  if (!query) return CONTEXT_TAGS;
  const q = query.toLowerCase();
  return CONTEXT_TAGS.filter(t =>
    t.trigger.startsWith(q) ||
    t.label.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (t as any).aliases?.some((a: string) => a.startsWith(q))
  );
}

interface ContextTagPickerProps {
  query: string;
  onSelect: (tag: ContextTag) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export default function ContextTagPicker({ query, onSelect, onClose, anchorRef }: ContextTagPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = useMemo(() => searchTags(query), [query]);

  const grouped = useMemo(() => {
    const map: Partial<Record<TagCategory, ContextTag[]>> = {};
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter(t => t.category === cat);
      if (items.length) map[cat] = items;
    }
    return map;
  }, [filtered]);

  const flatList = useMemo(() => {
    const flat: ContextTag[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (grouped[cat]) flat.push(...grouped[cat]!);
    }
    return flat;
  }, [grouped]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % Math.max(1, flatList.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + Math.max(1, flatList.length)) % Math.max(1, flatList.length));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (flatList[activeIdx]) onSelect(flatList[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatList, activeIdx, onSelect, onClose]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node) &&
          !anchorRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  if (flatList.length === 0) return null;

  let globalIdx = 0;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        mb: 1,
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 'lg',
        boxShadow: 'lg',
        maxHeight: 340,
        overflowY: 'auto',
        zIndex: 1500,
        animation: 'tagIn 0.12s ease-out',
        '@keyframes tagIn': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'neutral.200', borderRadius: 3 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2, py: 0.75,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.level1',
          position: 'sticky', top: 0, zIndex: 1,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography
              level="body-xs"
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'warning.500', fontSize: '13px' }}
            >
              #
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
              {query ? `"${query}"` : 'context tags'}
            </Typography>
          </Stack>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
            ↑↓ navigate · ↵ select
          </Typography>
        </Stack>
      </Box>

      {/* Groups */}
      {CATEGORY_ORDER.map(cat => {
        const tags = grouped[cat];
        if (!tags?.length) return null;
        const { label, color } = CATEGORY_META[cat];

        return (
          <Box key={cat}>
            <Box sx={{ px: 2, pt: 1.25, pb: 0.25 }}>
              <Typography
                level="body-xs"
                sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color }}
              >
                {label}
              </Typography>
            </Box>

            {tags.map(tag => {
              const idx = globalIdx++;
              const isActive = idx === activeIdx;
              const Icon = tag.icon;

              return (
                <Box
                  key={tag.id}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => onSelect(tag)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 2, py: 0.625, cursor: 'pointer',
                    bgcolor: isActive ? 'warning.softBg' : 'transparent',
                    transition: 'background 0.08s',
                    '&:hover': { bgcolor: 'warning.softBg' },
                  }}
                >
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: 'sm', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isActive ? 'warning.100' : 'background.level2',
                      transition: 'background 0.08s',
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? 'var(--joy-palette-warning-600)' : 'var(--joy-palette-text-tertiary)' }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography
                        level="body-sm"
                        fontWeight={isActive ? 600 : 400}
                        sx={{ color: isActive ? 'warning.700' : 'text.primary', fontSize: '13px' }}
                      >
                        {tag.label}
                      </Typography>
                      <Typography
                        level="body-xs"
                        sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.tertiary', opacity: 0.7 }}
                      >
                        #{tag.trigger}
                      </Typography>
                    </Stack>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px', mt: 0.1 }} noWrap>
                      {tag.description}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}

      {/* Footer */}
      <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1', position: 'sticky', bottom: 0 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
          Tags inject context into the AI — they don&apos;t appear in your message
        </Typography>
      </Box>
    </Box>
  );
}
