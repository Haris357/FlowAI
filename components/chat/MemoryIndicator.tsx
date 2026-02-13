'use client';

import { Box, Typography, Chip, LinearProgress, Tooltip, Stack } from '@mui/joy';
import { Brain, Layers, MessageSquare } from 'lucide-react';
import { useMemoryStats } from '@/hooks/useMemoryStats';
import { MEMORY_CONFIG } from '@/lib/ai-memory';

export default function MemoryIndicator() {
  const { stats, loading } = useMemoryStats();

  if (loading || !stats || !stats.hasActiveMemory) {
    return null;
  }

  const getHealthColor = (health: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'neutral';
    }
  };

  const formatTokens = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const healthColor = getHealthColor(stats.memoryHealth);

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5, minWidth: 180 }}>
          <Typography level="body-xs" fontWeight={700} sx={{ mb: 1 }}>
            Context Memory
          </Typography>
          <Stack spacing={0.75}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Context Window</Typography>
              <Typography level="body-xs" fontWeight={600}>
                {formatTokens(stats.totalTokens)} / {formatTokens(MEMORY_CONFIG.CONTEXT_BUDGET)}
              </Typography>
            </Box>
            <LinearProgress
              determinate
              value={Math.min(stats.usagePercentage * 100, 100)}
              color={healthColor}
              sx={{ height: 3, borderRadius: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Messages</Typography>
              <Typography level="body-xs" fontWeight={600}>{stats.totalMessages}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Compactions</Typography>
              <Typography level="body-xs" fontWeight={600}>{stats.compactionCount}</Typography>
            </Box>
            {stats.compactionCount > 0 && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontStyle: 'italic', mt: 0.5 }}>
                Memory auto-compacted to stay within budget
              </Typography>
            )}
          </Stack>
        </Box>
      }
      placement="top"
      variant="outlined"
    >
      <Chip
        size="sm"
        variant="soft"
        color={healthColor}
        startDecorator={<Brain size={12} />}
        sx={{
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
          '--Chip-paddingInline': '8px',
          '&:hover': { opacity: 0.85 },
        }}
      >
        {stats.totalMessages} msgs · {formatTokens(stats.totalTokens)}
      </Chip>
    </Tooltip>
  );
}
