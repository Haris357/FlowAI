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
import { Settings, Trash2, Clock, Mic, MessageSquare, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { ChatSettings as ChatSettingsType } from '@/types';
import DangerousConfirmDialog from '@/components/common/DangerousConfirmDialog';
import { useMemoryStats } from '@/hooks/useMemoryStats';
import { clearAllConversationMemory } from '@/lib/ai-memory';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { stats, loading: loadingStats, refresh: refreshStats } = useMemoryStats();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMemoryResetConfirm, setShowMemoryResetConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResettingMemory, setIsResettingMemory] = useState(false);

  // Refresh stats when modal opens
  useEffect(() => {
    if (open) {
      refreshStats();
    }
  }, [open]);

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
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalDialog
          variant="outlined"
          sx={{
            width: 420,
            borderRadius: 'lg',
          }}
        >
          <ModalClose />
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 'md',
                  bgcolor: 'primary.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Settings size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
              </Box>
              <Typography level="title-lg">Chat Settings</Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={3}>
            {/* Display Settings */}
            <Box>
              <Typography level="title-sm" sx={{ mb: 1.5, color: 'text.secondary' }}>
                Display
              </Typography>
              <Stack spacing={2}>
                <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                  <Stack spacing={0.5}>
                    <FormLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Clock size={16} />
                        <span>Show timestamps</span>
                      </Stack>
                    </FormLabel>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
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
                  <Stack spacing={0.5}>
                    <FormLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MessageSquare size={16} />
                        <span>Welcome greeting</span>
                      </Stack>
                    </FormLabel>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
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
              <Typography level="title-sm" sx={{ mb: 1.5, color: 'text.secondary' }}>
                Input
              </Typography>
              <Stack spacing={2}>
                <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                  <Stack spacing={0.5}>
                    <FormLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Mic size={16} />
                        <span>Voice input</span>
                      </Stack>
                    </FormLabel>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      Enable speech-to-text for messages
                    </Typography>
                  </Stack>
                  <Switch
                    checked={settings.voiceInputEnabled}
                    onChange={(e) => onUpdateSettings({ voiceInputEnabled: e.target.checked })}
                    color="primary"
                  />
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* AI Memory Statistics */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography level="title-sm" sx={{ color: 'text.secondary' }}>
                  AI Memory
                </Typography>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={refreshStats}
                  disabled={loadingStats}
                  sx={{
                    '@keyframes spin': {
                      from: { transform: 'rotate(0deg)' },
                      to: { transform: 'rotate(360deg)' },
                    },
                    '& svg': {
                      animation: loadingStats ? 'spin 1s linear infinite' : 'none',
                    },
                  }}
                >
                  <RefreshCw size={14} />
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
                    borderColor: `${getMemoryHealthColor(stats.memoryHealth)}.200`,
                    bgcolor: `${getMemoryHealthColor(stats.memoryHealth)}.50`,
                  }}
                >
                  <Stack spacing={2}>
                    {/* Memory Health Badge */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Database size={18} />
                        <Typography level="title-sm">Memory Status</Typography>
                      </Stack>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={getMemoryHealthColor(stats.memoryHealth)}
                        startDecorator={
                          stats.memoryHealth === 'critical' ? <AlertTriangle size={14} /> : null
                        }
                      >
                        {stats.memoryHealth === 'healthy' && 'Healthy'}
                        {stats.memoryHealth === 'warning' && 'High Usage'}
                        {stats.memoryHealth === 'critical' && 'Critical'}
                      </Chip>
                    </Stack>

                    {/* Memory Usage Bar */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          Token Usage
                        </Typography>
                        <Typography level="body-xs" fontWeight="bold">
                          {formatNumber(stats.totalTokens)} / 100,000
                        </Typography>
                      </Stack>
                      <LinearProgress
                        determinate
                        value={stats.usagePercentage * 100}
                        color={getMemoryHealthColor(stats.memoryHealth)}
                        sx={{ height: 6 }}
                      />
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {(stats.usagePercentage * 100).toFixed(1)}% of capacity used
                      </Typography>
                    </Box>

                    {/* Stats Grid */}
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          Conversations
                        </Typography>
                        <Typography level="h4" fontWeight="bold">
                          {stats.totalConversations}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" />
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          Messages
                        </Typography>
                        <Typography level="h4" fontWeight="bold">
                          {formatNumber(stats.totalMessages)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Memory Actions */}
                    {stats.hasActiveMemory && (
                      <>
                        <Divider />
                        <Button
                          variant="outlined"
                          color="danger"
                          size="sm"
                          startDecorator={<Trash2 size={16} />}
                          onClick={() => setShowMemoryResetConfirm(true)}
                          fullWidth
                        >
                          Factory Reset Memory
                        </Button>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
                          Clears all AI conversation history and context
                        </Typography>
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
              <Typography level="title-sm" sx={{ mb: 1.5, color: 'danger.500' }}>
                Danger Zone
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'danger.200',
                  bgcolor: 'danger.50',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5}>
                    <Typography level="title-sm">Clear all chats</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {chatCount > 0
                        ? `Delete all ${chatCount} chat${chatCount > 1 ? 's' : ''} and their messages`
                        : 'No chats to delete'}
                    </Typography>
                  </Stack>
                  <Button
                    variant="solid"
                    color="danger"
                    size="sm"
                    startDecorator={<Trash2 size={16} />}
                    disabled={chatCount === 0}
                    onClick={() => setShowClearConfirm(true)}
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
          'Token usage history',
        ]}
      />
    </>
  );
}
