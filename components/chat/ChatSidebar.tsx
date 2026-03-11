'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
  Tooltip,
} from '@mui/joy';
import {
  Plus,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import UsageMeter from '@/components/subscription/UsageMeter';
import { Chat } from '@/types';
import FormShortcuts, { FormShortcut } from './FormShortcuts';
import ChatHistoryModal from './ChatHistoryModal';

interface ChatSidebarProps {
  sessions: Chat[];
  currentSessionId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onSelectShortcut: (shortcut: FormShortcut) => void;
  onOpenSettings: () => void;
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  collapsed,
  onToggleCollapse,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onSelectShortcut,
  onOpenSettings,
}: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const sidebarWidth = collapsed ? 60 : 240;

  return (
    <>
      <Box
        sx={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.surface',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={collapsed ? 'center' : 'space-between'}
          sx={{ px: collapsed ? 1 : 2, py: 1.5, minHeight: 56 }}
        >
          {!collapsed && (
            <FlowBooksLogoJoy iconSize={28} fontSize="1rem" />
          )}
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton
              size="sm"
              variant="plain"
              onClick={onToggleCollapse}
              sx={{ borderRadius: 'sm' }}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* New Chat Button */}
        <Box sx={{ px: collapsed ? 1 : 1.5, pb: 1 }}>
          {collapsed ? (
            <Tooltip title="New Chat" placement="right">
              <IconButton
                variant="solid"
                color="primary"
                onClick={onNewChat}
                sx={{ width: '100%', borderRadius: 'sm' }}
              >
                <Plus size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={16} />}
              onClick={onNewChat}
              fullWidth
              sx={{ borderRadius: 'sm', fontWeight: 600 }}
            >
              New Chat
            </Button>
          )}
        </Box>

        {/* Chats Button */}
        <Box sx={{ px: collapsed ? 1 : 1.5, pb: 0.5 }}>
          {collapsed ? (
            <Tooltip title={`Chats (${sessions.length})`} placement="right">
              <IconButton
                variant="soft"
                color="neutral"
                onClick={() => setHistoryModalOpen(true)}
                sx={{ width: '100%', borderRadius: 'sm' }}
              >
                <History size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="soft"
              color="neutral"
              startDecorator={<History size={16} />}
              onClick={() => setHistoryModalOpen(true)}
              fullWidth
              sx={{
                borderRadius: 'sm',
                justifyContent: 'flex-start',
                fontWeight: 500,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Chats</span>
                <Typography
                  level="body-xs"
                  sx={{
                    bgcolor: 'background.level2',
                    px: 1,
                    py: 0.25,
                    borderRadius: 'sm',
                    fontWeight: 600,
                  }}
                >
                  {sessions.length}
                </Typography>
              </Box>
            </Button>
          )}
        </Box>

        {/* Search Chats Button */}
        <Box sx={{ px: collapsed ? 1 : 1.5, pb: 1.5 }}>
          {collapsed ? (
            <Tooltip title="Search Chats" placement="right">
              <IconButton
                variant="plain"
                color="neutral"
                onClick={() => router.push(`/companies/${companyId}/chats`)}
                sx={{ width: '100%', borderRadius: 'sm' }}
              >
                <Search size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="plain"
              color="neutral"
              startDecorator={<Search size={16} />}
              onClick={() => router.push(`/companies/${companyId}/chats`)}
              fullWidth
              sx={{
                borderRadius: 'sm',
                justifyContent: 'flex-start',
                fontWeight: 500,
              }}
            >
              Search Chats
            </Button>
          )}
        </Box>

        <Divider />

        {/* Quick Actions */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {collapsed ? (
            <Box sx={{ py: 1 }}>
              <FormShortcuts collapsed={collapsed} onSelectShortcut={onSelectShortcut} />
            </Box>
          ) : (
            <Accordion defaultExpanded sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <AccordionSummary
                indicator={<ChevronDown size={14} />}
                sx={{
                  px: 2,
                  py: 1,
                  minHeight: 36,
                  '& .MuiAccordionSummary-button': {
                    gap: 1,
                  },
                  '&:hover': {
                    bgcolor: 'background.level1',
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Zap size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  <Typography
                    level="body-xs"
                    sx={{
                      color: 'text.tertiary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '10px',
                    }}
                  >
                    Quick Actions
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <FormShortcuts collapsed={collapsed} onSelectShortcut={onSelectShortcut} />
              </AccordionDetails>
            </Accordion>
          )}
        </Box>

        <Divider />

        {/* Usage Meter */}
        <Box sx={{ px: collapsed ? 0.75 : 2, pt: 1.5, pb: 1 }}>
          <UsageMeter compact collapsed={collapsed} />
        </Box>

        {/* Settings Button */}
        <Box sx={{ p: collapsed ? 1 : 1.5 }}>
          {collapsed ? (
            <Tooltip title="Settings" placement="right">
              <IconButton
                variant="plain"
                color="neutral"
                onClick={onOpenSettings}
                sx={{ width: '100%', borderRadius: 'sm' }}
              >
                <Settings size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="plain"
              color="neutral"
              startDecorator={<Settings size={16} />}
              onClick={onOpenSettings}
              fullWidth
              sx={{
                borderRadius: 'sm',
                justifyContent: 'flex-start',
              }}
            >
              Settings
            </Button>
          )}
        </Box>
      </Box>

      {/* Chat History Modal */}
      <ChatHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectChat={onSelectChat}
        onDeleteChat={onDeleteChat}
        onRenameChat={onRenameChat}
      />
    </>
  );
}
