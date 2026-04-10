'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Stack, Typography, Chip } from '@mui/joy';
import { COMMANDS, CATEGORY_META, searchCommands, groupCommands, SlashCommand, CommandCategory } from '@/lib/commands';

interface CommandPaletteProps {
  query: string;           // text after the `/`
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const CATEGORY_ORDER: CommandCategory[] = ['create', 'find', 'reports', 'ai', 'actions'];

export default function CommandPalette({ query, onSelect, onClose, anchorRef }: CommandPaletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = useMemo(() => searchCommands(query), [query]);
  const flatList = useMemo(() => {
    // Flatten in category order for keyboard nav
    const grouped = groupCommands(filtered);
    const flat: SlashCommand[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (grouped[cat]) flat.push(...grouped[cat]!);
    }
    return flat;
  }, [filtered]);

  const grouped = useMemo(() => groupCommands(filtered), [filtered]);

  // Reset active index when query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % flatList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + flatList.length) % flatList.length);
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

  // Scroll active item into view
  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Click outside closes
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
        maxHeight: 380,
        overflowY: 'auto',
        zIndex: 1500,
        animation: 'paletteIn 0.12s ease-out',
        '@keyframes paletteIn': {
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
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.level1',
          position: 'sticky', top: 0, zIndex: 1,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography
              level="body-xs"
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.500', fontSize: '13px' }}
            >
              /
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
              {query ? `"${query}"` : 'commands'}
            </Typography>
          </Stack>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
            ↑↓ navigate · ↵ select · Esc close
          </Typography>
        </Stack>
      </Box>

      {/* Groups */}
      {CATEGORY_ORDER.map(cat => {
        const cmds = grouped[cat];
        if (!cmds?.length) return null;
        const { label, color } = CATEGORY_META[cat];

        return (
          <Box key={cat}>
            {/* Category label */}
            <Box sx={{ px: 2, pt: 1.25, pb: 0.25 }}>
              <Typography
                level="body-xs"
                sx={{
                  fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color,
                }}
              >
                {label}
              </Typography>
            </Box>

            {cmds.map(cmd => {
              const idx = globalIdx++;
              const isActive = idx === activeIdx;
              const Icon = cmd.icon;

              return (
                <Box
                  key={cmd.id}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => onSelect(cmd)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 0.75,
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
                    <Icon size={14} style={{ color: isActive ? 'var(--joy-palette-primary-600)' : 'var(--joy-palette-text-tertiary)' }} />
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        level="body-sm"
                        fontWeight={isActive ? 600 : 400}
                        sx={{ color: isActive ? 'primary.700' : 'text.primary', fontSize: '13px' }}
                      >
                        {cmd.label}
                      </Typography>
                      <Typography
                        level="body-xs"
                        sx={{
                          fontFamily: 'monospace', fontSize: '11px',
                          color: 'text.tertiary', opacity: 0.7,
                        }}
                      >
                        /{cmd.trigger}
                      </Typography>
                    </Stack>
                    <Typography
                      level="body-xs"
                      sx={{ color: 'text.tertiary', fontSize: '11px', mt: 0.1 }}
                      noWrap
                    >
                      {cmd.description}
                    </Typography>
                  </Box>

                  {/* Shortcut hint */}
                  {cmd.shortcut && (
                    <Chip
                      size="sm"
                      variant="outlined"
                      color="neutral"
                      sx={{ fontSize: '10px', fontFamily: 'monospace', borderColor: 'divider', flexShrink: 0 }}
                    >
                      {cmd.shortcut}
                    </Chip>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}

      {/* Footer */}
      <Box
        sx={{
          px: 2, py: 0.75,
          borderTop: '1px solid', borderColor: 'divider',
          bgcolor: 'background.level1',
          position: 'sticky', bottom: 0,
        }}
      >
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
          {flatList.length} command{flatList.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ' available'}
        </Typography>
      </Box>
    </Box>
  );
}
