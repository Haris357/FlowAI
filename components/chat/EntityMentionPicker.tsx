'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Stack, Typography, Chip, CircularProgress } from '@mui/joy';
import {
  Users, Building2, FileText, Receipt, UserCheck,
  ClipboardList, ArrowLeftRight, Landmark,
} from 'lucide-react';
import { EntityResult, EntityType, ENTITY_TYPE_META } from '@/hooks/useEntitySearch';

interface EntityMentionPickerProps {
  query: string;              // text after the `@`
  results: EntityResult[];
  loading: boolean;
  onSelect: (result: EntityResult) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const TYPE_ICON: Record<EntityType, React.ElementType> = {
  customer:    Users,
  vendor:      Building2,
  invoice:     FileText,
  bill:        Receipt,
  employee:    UserCheck,
  quote:       ClipboardList,
  transaction: ArrowLeftRight,
  account:     Landmark,
};

const BADGE_COLORS: Record<string, string> = {
  success: 'var(--joy-palette-success-500)',
  warning: 'var(--joy-palette-warning-500)',
  danger:  'var(--joy-palette-danger-400)',
  primary: 'var(--joy-palette-primary-500)',
  neutral: 'var(--joy-palette-neutral-400)',
};

const TYPE_ORDER: EntityType[] = ['customer', 'vendor', 'invoice', 'bill', 'employee', 'quote', 'transaction', 'account'];

export default function EntityMentionPicker({
  query, results, loading, onSelect, onClose, anchorRef,
}: EntityMentionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Group results by entity type
  const grouped = useMemo(() => {
    const map: Partial<Record<EntityType, EntityResult[]>> = {};
    for (const r of results) {
      if (!map[r.type]) map[r.type] = [];
      map[r.type]!.push(r);
    }
    return map;
  }, [results]);

  const flatList = useMemo(() => {
    const flat: EntityResult[] = [];
    for (const t of TYPE_ORDER) {
      if (grouped[t]) flat.push(...grouped[t]!);
    }
    return flat;
  }, [grouped]);

  useEffect(() => { setActiveIdx(0); }, [query, results]);

  // Keyboard nav
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

  // Scroll active into view
  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Click outside
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

  if (!loading && flatList.length === 0 && query.length < 1) return null;

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
        maxHeight: 360,
        overflowY: 'auto',
        zIndex: 1500,
        animation: 'entityIn 0.12s ease-out',
        '@keyframes entityIn': {
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
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.500', fontSize: '13px' }}
            >
              @
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
              {query ? `"${query}"` : 'mention an entity'}
            </Typography>
          </Stack>
          {loading ? (
            <CircularProgress size="sm" sx={{ '--CircularProgress-size': '14px' }} />
          ) : (
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
              ↑↓ navigate · ↵ select
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Empty state */}
      {!loading && flatList.length === 0 && query.length >= 1 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            No results for &quot;{query}&quot;
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
            Try searching by name, number, or email
          </Typography>
        </Box>
      )}

      {/* Loading skeletons */}
      {loading && (
        <Box sx={{ p: 1 }}>
          {[80, 65, 70, 55].map((w, i) => (
            <Box key={i} sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: 'sm', bgcolor: 'background.level2',
                animation: `skelPulse 1.4s ease-in-out ${i * 0.1}s infinite`,
                '@keyframes skelPulse': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } },
                flexShrink: 0,
              }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{
                  height: 10, borderRadius: 1, bgcolor: 'background.level2', width: `${w}%`,
                  animation: `skelPulse 1.4s ease-in-out ${i * 0.1}s infinite`,
                }} />
                <Box sx={{
                  height: 8, borderRadius: 1, bgcolor: 'background.level2', width: `${w - 20}%`, mt: 0.75,
                  animation: `skelPulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Grouped results */}
      {!loading && TYPE_ORDER.map(type => {
        const items = grouped[type];
        if (!items?.length) return null;
        const meta = ENTITY_TYPE_META[type];
        const Icon = TYPE_ICON[type];

        return (
          <Box key={type}>
            {/* Group header */}
            <Box sx={{ px: 2, pt: 1, pb: 0.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
              <Typography
                level="body-xs"
                sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: meta.color }}
              >
                {meta.label}s
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', opacity: 0.6 }}>
                {items.length}
              </Typography>
            </Box>

            {items.map(result => {
              const idx = globalIdx++;
              const isActive = idx === activeIdx;

              return (
                <Box
                  key={result.id}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => onSelect(result)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 0.625,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'primary.softBg' : 'transparent',
                    transition: 'background 0.08s',
                    '&:hover': { bgcolor: 'primary.softBg' },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: 'sm', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isActive ? 'primary.100' : 'background.level2',
                      transition: 'background 0.08s',
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? 'var(--joy-palette-primary-600)' : meta.color, opacity: isActive ? 1 : 0.7 }} />
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      level="body-sm"
                      fontWeight={isActive ? 600 : 500}
                      noWrap
                      sx={{ color: isActive ? 'primary.700' : 'text.primary', fontSize: '13px' }}
                    >
                      {result.label}
                    </Typography>
                    {result.sub && (
                      <Typography
                        level="body-xs"
                        noWrap
                        sx={{ color: 'text.tertiary', fontSize: '11px', mt: 0.1 }}
                      >
                        {result.sub}
                      </Typography>
                    )}
                  </Box>

                  {/* Badge + Amount */}
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                    {result.amount !== undefined && (
                      <Typography
                        level="body-xs"
                        sx={{
                          fontWeight: 600, fontSize: '11px',
                          color: result.type === 'bill' ? 'danger.500' : 'success.600',
                        }}
                      >
                        {result.currency ? `${result.currency} ` : ''}
                        {result.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </Typography>
                    )}
                    {result.badge && (
                      <Chip
                        size="sm"
                        variant="soft"
                        color={result.badgeColor || 'neutral'}
                        sx={{ fontSize: '10px', height: 18, textTransform: 'capitalize', '--Chip-paddingInline': '6px' }}
                      >
                        {result.badge}
                      </Chip>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        );
      })}

      {/* Footer */}
      {!loading && flatList.length > 0 && (
        <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1', position: 'sticky', bottom: 0 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
            {flatList.length} result{flatList.length !== 1 ? 's' : ''}
            {query ? ` for "${query}"` : ''} · selecting attaches full entity context to message
          </Typography>
        </Box>
      )}
    </Box>
  );
}
