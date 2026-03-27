'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Button,
  Stack,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  Box,
  LinearProgress,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/joy';
import { Settings, Trash2, Clock, Mic, MessageSquare, Database, RefreshCw, AlertTriangle, Zap, CalendarDays, Calendar } from 'lucide-react';
import { ChatSettings as ChatSettingsType } from '@/types';
import DangerousConfirmDialog from '@/components/common/DangerousConfirmDialog';
import { useMemoryStats } from '@/hooks/useMemoryStats';
import { clearAllConversationMemory, MEMORY_CONFIG } from '@/lib/ai-memory';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ChatSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: ChatSettingsType;
  onUpdateSettings: (settings: Partial<ChatSettingsType>) => void;
  onClearAllChats: () => Promise<void>;
  chatCount: number;
}

export default function ChatSettings({
  open,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllChats,
  chatCount,
}: ChatSettingsProps) {
  const { company } = useCompany();
  const { user } = useAuth();
  const { usage, plan, sessionRemaining, sessionPercentUsed, sessionTimeLeft, weeklyRemaining, weeklyPercentUsed, weeklyResetsAt, refreshUsage, isPaidSubscriber, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const { stats, loading: loadingStats, refresh: refreshStats } = useMemoryStats();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMemoryResetConfirm, setShowMemoryResetConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResettingMemory, setIsResettingMemory] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  // Refresh stats when modal opens
  useEffect(() => {
    if (open) {
      refreshStats();
      refreshUsage();
      setLastUpdated(new Date());
    }
  }, [open]);

  // Update "last updated" text every 10s
  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diff < 10) setTimeSinceUpdate('Just now');
      else if (diff < 60) setTimeSinceUpdate(`${diff}s ago`);
      else setTimeSinceUpdate(`${Math.floor(diff / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Track when real-time snapshot updates
  useEffect(() => {
    if (open && usage) {
      setLastUpdated(new Date());
    }
  }, [usage?.sessionTokensUsed, usage?.weeklyTokensUsed]);

  const handleClearAllChats = async () => {
    setIsClearing(true);
    try {
      await onClearAllChats();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleFactoryReset = async () => {
    if (!company?.id || !user?.uid) return;

    setIsResettingMemory(true);
    try {
      await clearAllConversationMemory(company.id, user.uid);
      await refreshStats();
      setShowMemoryResetConfirm(false);
    } finally {
      setIsResettingMemory(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getMemoryHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'neutral';
    }
  };

  const getUsageColor = (percent: number): 'primary' | 'warning' | 'danger' => {
    if (percent > 80) return 'danger';
    if (percent > 50) return 'warning';
    return 'primary';
  };

  const sessionUsed = usage?.sessionTokensUsed || 0;
  const sessionLimit = plan.sessionTokenLimit;
  const sessionPct = sessionLimit > 0 ? Math.min(100, (sessionUsed / sessionLimit) * 100) : 0;
  const weeklyUsed = usage?.weeklyTokensUsed || 0;
  const weeklyLimit = plan.weeklyTokenLimit;
  const weeklyPct = weeklyLimit > 0 ? Math.min(100, (weeklyUsed / weeklyLimit) * 100) : 0;

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: { xs: '95vw', sm: 460 },
            width: '100%',
            maxHeight: { xs: '90vh', sm: '85vh' },
            overflowY: 'auto',
            borderRadius: 'lg',
          }}
        >
          <ModalClose />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 'md',
                bgcolor: 'primary.softBg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-lg">Chat Settings</Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2.5} sx={{ overflowY: 'auto', maxHeight: '70vh', pr: 0.5 }}>

            {/* ── Plan Usage Limits ── */}
            <Box>
              <Typography level="body-xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" sx={{ mb: 1.5, color: 'text.tertiary' }}>
                Plan usage limits
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.level1',
                }}
              >
                <Stack spacing={2}>
                  {/* Session Usage */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Zap size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
                        <Typography level="body-sm" fontWeight={600}>Current session</Typography>
                      </Stack>
                      <Typography level="body-xs" fontWeight={600} sx={{ color: getUsageColor(sessionPct) === 'danger' ? 'danger.500' : getUsageColor(sessionPct) === 'warning' ? 'warning.600' : 'text.secondary' }}>
                        {Math.round(sessionPct)}% used
                      </Typography>
                    </Stack>
                    <LinearProgress
                      determinate
                      value={sessionPct}
                      color={getUsageColor(sessionPct)}
                      sx={{ height: 6, borderRadius: 'sm', bgcolor: 'background.level2' }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {sessionUsed} / {sessionLimit} messages
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {sessionTimeLeft ? `Resets in ${sessionTimeLeft}` : 'New session'}
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Weekly Usage */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarDays size={14} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        <Typography level="body-sm" fontWeight={600}>This week</Typography>
                      </Stack>
                      <Typography level="body-xs" fontWeight={600} sx={{ color: getUsageColor(weeklyPct) === 'danger' ? 'danger.500' : getUsageColor(weeklyPct) === 'warning' ? 'warning.600' : 'text.secondary' }}>
                        {Math.round(weeklyPct)}% used
                      </Typography>
                    </Stack>
                    <LinearProgress
                      determinate
                      value={weeklyPct}
                      color={getUsageColor(weeklyPct)}
                      sx={{ height: 6, borderRadius: 'sm', bgcolor: 'background.level2' }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {Math.round(weeklyPct)}% used
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Resets Monday
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Plan & Last Updated */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="sm" variant="soft" color={isPaidSubscriber ? 'success' : trialExpired ? 'danger' : isTrial ? 'warning' : 'primary'} sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {isPaidSubscriber ? `${plan.name} Plan` : trialExpired ? 'Trial Expired' : isTrial ? `${plan.name} Trial` : `${plan.name} Plan`}
                      </Chip>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {isPaidSubscriber ? 'Active subscription' : trialExpired ? 'Subscribe to continue' : isTrial && trialTimeLeft ? `${trialTimeLeft} left` : 'Active subscription'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.675rem' }}>
                        Updated: {timeSinceUpdate}
                      </Typography>
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => { refreshUsage(); setLastUpdated(new Date()); }}
                        sx={{ '--IconButton-size': '22px' }}
                      >
                        <RefreshCw size={11} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            <Divider />

            {/* Display Settings */}
            <Box>
              <Typography level="body-xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" sx={{ mb: 1.5, color: 'text.tertiary' }}>
                Display
              </Typography>
              <Stack spacing={1.5}>
                <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                  <Stack spacing={0.25}>
                    <FormLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Clock size={15} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        <span>Show timestamps</span>
                      </Stack>
                    </FormLabel>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', pl: 3.25 }}>
                      Display time for each message
                    </Typography>
                  </Stack>
                  <Switch
                    checked={settings.showTimestamps}
                    onChange={(e) => onUpdateSettings({ showTimestamps: e.target.checked })}
                    color="primary"
                  />
                </FormControl>

                <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                  <Stack spacing={0.25}>
                    <FormLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MessageSquare size={15} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        <span>Welcome greeting</span>
                      </Stack>
                    </FormLabel>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', pl: 3.25 }}>
                      Show welcome message on new chats
                    </Typography>
                  </Stack>
                  <Switch
                    checked={settings.defaultGreeting}
                    onChange={(e) => onUpdateSettings({ defaultGreeting: e.target.checked })}
                    color="primary"
                  />
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Input Settings */}
            <Box>
              <Typography level="body-xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" sx={{ mb: 1.5, color: 'text.tertiary' }}>
                Input
              </Typography>
              <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                <Stack spacing={0.25}>
                  <FormLabel>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Mic size={15} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                      <span>Voice input</span>
                    </Stack>
                  </FormLabel>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', pl: 3.25 }}>
                    Enable speech-to-text for messages
                  </Typography>
                </Stack>
                <Switch
                  checked={settings.voiceInputEnabled}
                  onChange={(e) => onUpdateSettings({ voiceInputEnabled: e.target.checked })}
                  color="primary"
                />
              </FormControl>
            </Box>

            <Divider />

            {/* AI Memory Statistics */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography level="body-xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" sx={{ color: 'text.tertiary' }}>
                  AI Memory
                </Typography>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={refreshStats}
                  disabled={loadingStats}
                  sx={{
                    '--IconButton-size': '28px',
                    '@keyframes spin': {
                      from: { transform: 'rotate(0deg)' },
                      to: { transform: 'rotate(360deg)' },
                    },
                    '& svg': {
                      animation: loadingStats ? 'spin 1s linear infinite' : 'none',
                    },
                  }}
                >
                  <RefreshCw size={13} />
                </IconButton>
              </Stack>

              {loadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size="sm" />
                </Box>
              ) : stats ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.level1',
                  }}
                >
                  <Stack spacing={2}>
                    {/* Memory Health Badge */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Database size={16} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        <Typography level="body-sm" fontWeight={600}>Memory Status</Typography>
                      </Stack>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={getMemoryHealthColor(stats.memoryHealth)}
                        startDecorator={
                          stats.memoryHealth === 'critical' ? <AlertTriangle size={12} /> : null
                        }
                        sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                      >
                        {stats.memoryHealth === 'healthy' && 'Healthy'}
                        {stats.memoryHealth === 'warning' && 'High Usage'}
                        {stats.memoryHealth === 'critical' && 'Critical'}
                      </Chip>
                    </Stack>

                    {/* Memory Usage Bar */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          Context Usage
                        </Typography>
                        <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.secondary' }}>
                          {formatNumber(stats.totalTokens)} / {formatNumber(MEMORY_CONFIG.CONTEXT_BUDGET)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        determinate
                        value={stats.usagePercentage * 100}
                        color={getMemoryHealthColor(stats.memoryHealth)}
                        sx={{
                          height: 5,
                          borderRadius: 'sm',
                          bgcolor: 'background.level2',
                        }}
                      />
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5, fontSize: '0.675rem' }}>
                        {(stats.usagePercentage * 100).toFixed(1)}% of context capacity used
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Stats Grid */}
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>
                          Conversations
                        </Typography>
                        <Typography level="title-lg" fontWeight={700}>
                          {stats.totalConversations}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" />
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>
                          Messages
                        </Typography>
                        <Typography level="title-lg" fontWeight={700}>
                          {formatNumber(stats.totalMessages)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Memory Actions */}
                    {stats.hasActiveMemory && (
                      <>
                        <Divider />
                        <Button
                          variant="plain"
                          color="danger"
                          size="sm"
                          startDecorator={<Trash2 size={14} />}
                          onClick={() => setShowMemoryResetConfirm(true)}
                          fullWidth
                          sx={{ fontWeight: 500 }}
                        >
                          Reset Memory
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center', py: 2 }}>
                  No memory data available
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Danger Zone */}
            <Box>
              <Typography level="body-xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" sx={{ mb: 1.5, color: 'text.tertiary' }}>
                Data
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.level1',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.25}>
                    <Typography level="body-sm" fontWeight={600}>Clear all chats</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {chatCount > 0
                        ? `Delete all ${chatCount} chat${chatCount > 1 ? 's' : ''} and messages`
                        : 'No chats to delete'}
                    </Typography>
                  </Stack>
                  <Button
                    variant="soft"
                    color="danger"
                    size="sm"
                    startDecorator={<Trash2 size={14} />}
                    disabled={chatCount === 0}
                    onClick={() => setShowClearConfirm(true)}
                    sx={{ fontWeight: 500 }}
                  >
                    Clear All
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Clear Confirmation Dialog */}
      <DangerousConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllChats}
        title="Clear All Chats"
        description="This action cannot be undone. All your chat history will be permanently deleted."
        confirmPhrase="DELETE ALL"
        confirmText="Delete All Chats"
        loading={isClearing}
        warningItems={[
          `${chatCount} chat session${chatCount > 1 ? 's' : ''}`,
          'All messages in those chats',
          'Chat history and context',
        ]}
      />

      {/* Memory Factory Reset Confirmation */}
      <DangerousConfirmDialog
        open={showMemoryResetConfirm}
        onClose={() => setShowMemoryResetConfirm(false)}
        onConfirm={handleFactoryReset}
        title="Factory Reset AI Memory"
        description="This will permanently delete all AI conversation memory, including summaries and context. The AI will not remember any previous conversations."
        confirmPhrase="RESET MEMORY"
        confirmText="Reset All Memory"
        loading={isResettingMemory}
        warningItems={[
          `${stats?.totalConversations || 0} conversation${(stats?.totalConversations || 0) > 1 ? 's' : ''}`,
          `${stats?.totalMessages || 0} messages`,
          'All conversation summaries and context',
          'Context usage history',
        ]}
      />
    </>
  );
}
