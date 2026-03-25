'use client';

import { useState } from 'react';
import { Box, Typography, Tooltip, Stack, CircularProgress } from '@mui/joy';
import { Zap } from 'lucide-react';
import { useMemoryStats } from '@/hooks/useMemoryStats';
import { compactConversation } from '@/lib/ai-memory';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface MemoryIndicatorProps {
  chatId?: string | null;
  onCompacting?: (isCompacting: boolean) => void;
}

export default function MemoryIndicator({ chatId, onCompacting }: MemoryIndicatorProps) {
  const { stats, loading } = useMemoryStats(chatId);
  const { company } = useCompany();
  const { user } = useAuth();
  const [compacting, setCompacting] = useState(false);

  if (loading || !stats || !stats.hasActiveMemory) return null;

  const remaining = Math.round((1 - stats.usagePercentage) * 100);
  const used = Math.round(stats.usagePercentage * 100);

  if (used < 20) return null;

  const dotColor =
    stats.memoryHealth === 'critical' ? 'var(--joy-palette-danger-500)' :
    stats.memoryHealth === 'warning' ? 'var(--joy-palette-warning-500)' :
    'var(--joy-palette-neutral-400)';

  const handleCompact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!company?.id || !user?.uid || compacting) return;

    const targetChatId = chatId || await getLatestChatId(company.id, user.uid);
    if (!targetChatId) { toast.error('No conversation to compact'); return; }

    try {
      setCompacting(true);
      onCompacting?.(true);
      await compactConversation(company.id, targetChatId);
      toast.success('Context compacted');
    } catch {
      toast.error('Failed to compact context');
    } finally {
      setCompacting(false);
      onCompacting?.(false);
    }
  };

  return (
    <Tooltip
      placement="top"
      variant="outlined"
      title={
        <Box sx={{ p: 0.75, minWidth: 210 }}>
          <Stack spacing={1}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Context used</Typography>
                <Typography level="body-xs" fontWeight={700}>{used}%</Typography>
              </Box>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%', width: `${used}%`, borderRadius: 2,
                  bgcolor: stats.memoryHealth === 'critical' ? 'danger.500' : stats.memoryHealth === 'warning' ? 'warning.400' : 'neutral.400',
                  transition: 'width 0.4s ease',
                }} />
              </Box>
            </Box>
            <Typography level="body-xs" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {remaining}% of context remaining until auto-compact.
            </Typography>
            <Box onClick={handleCompact} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: compacting ? 'default' : 'pointer', color: 'primary.500', '&:hover': { color: 'primary.600', textDecoration: 'underline' } }}>
              {compacting ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '12px' }} /> : <Zap size={11} />}
              <Typography level="body-xs" sx={{ color: 'inherit', fontWeight: 600 }}>
                {compacting ? 'Compacting...' : 'Click to compact now.'}
              </Typography>
            </Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
              {stats.totalMessages} messages · {stats.compactionCount} compaction{stats.compactionCount !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Box>
      }
    >
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.375,
          borderRadius: 'sm', cursor: 'pointer', color: dotColor, transition: 'all 0.15s',
          '&:hover': { bgcolor: 'background.level1' },
        }}
      >
        <Box sx={{ position: 'relative', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="2" />
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 6}`}
              strokeDashoffset={`${2 * Math.PI * 6 * (1 - stats.usagePercentage)}`}
              strokeLinecap="round"
            />
          </svg>
        </Box>
        <Typography level="body-xs" sx={{ color: 'inherit', fontWeight: 600, fontSize: '11px', lineHeight: 1 }}>
          {remaining}%
        </Typography>
      </Box>
    </Tooltip>
  );
}

async function getLatestChatId(companyId: string, userId: string): Promise<string | null> {
  const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  const snap = await getDocs(query(
    collection(db, `companies/${companyId}/conversations`),
    where('userId', '==', userId), orderBy('updatedAt', 'desc'), limit(1)
  ));
  return snap.empty ? null : snap.docs[0].id;
}
