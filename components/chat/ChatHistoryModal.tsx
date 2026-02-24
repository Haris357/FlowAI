'use client';

import { useState, useMemo } from 'react';
import {
  Modal,
  ModalDialog,
  Box,
  Input,
  Stack,
  Typography,
  IconButton,
} from '@mui/joy';
import { Search, MessageSquare, X } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Chat } from '@/types';

interface ChatHistoryModalProps {
  open: boolean;
  onClose: () => void;
  sessions: Chat[];
  currentSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
}

interface GroupedChats {
  today: Chat[];
  yesterday: Chat[];
  thisWeek: Chat[];
  thisMonth: Chat[];
  older: Chat[];
}

function groupChatsByDate(chats: Chat[]): GroupedChats {
  const groups: GroupedChats = { today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [] };
  chats.forEach((chat) => {
    const date = chat.lastMessageAt?.toDate?.() || new Date();
    if (isToday(date)) groups.today.push(chat);
    else if (isYesterday(date)) groups.yesterday.push(chat);
    else if (isThisWeek(date)) groups.thisWeek.push(chat);
    else if (isThisMonth(date)) groups.thisMonth.push(chat);
    else groups.older.push(chat);
  });
  return groups;
}

function getRelativeTime(chat: Chat): string {
  const date = chat.lastMessageAt?.toDate?.() || new Date();
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
}

function ChatRow({
  chat,
  isActive,
  onSelect,
}: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        cursor: 'pointer',
        transition: 'background 0.1s ease',
        bgcolor: isActive ? 'primary.softBg' : 'transparent',
        '&:hover': {
          bgcolor: isActive ? 'primary.softBg' : 'neutral.softBg',
        },
      }}
    >
      <MessageSquare size={16} style={{ flexShrink: 0, opacity: 0.35 }} />
      <Typography
        level="body-sm"
        fontWeight={isActive ? 600 : 400}
        sx={{
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isActive ? 'primary.700' : 'text.primary',
        }}
      >
        {chat.title}
      </Typography>
      <Typography
        level="body-xs"
        sx={{
          flexShrink: 0,
          color: 'text.tertiary',
          whiteSpace: 'nowrap',
        }}
      >
        {getRelativeTime(chat)}
      </Typography>
    </Box>
  );
}

function ChatSection({
  label,
  chats,
  currentSessionId,
  onSelectChat,
  onClose,
}: {
  label: string;
  chats: Chat[];
  currentSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onClose: () => void;
}) {
  if (chats.length === 0) return null;

  return (
    <Box>
      {chats.map((chat) => (
        <ChatRow
          key={chat.id}
          chat={chat}
          isActive={chat.id === currentSessionId}
          onSelect={() => { onSelectChat(chat.id); onClose(); }}
        />
      ))}
    </Box>
  );
}

export default function ChatHistoryModal({
  open,
  onClose,
  sessions,
  currentSessionId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: ChatHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const lower = searchTerm.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(lower));
  }, [sessions, searchTerm]);

  const groupedChats = useMemo(() => groupChatsByDate(filteredSessions), [filteredSessions]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="plain"
        sx={{
          width: { xs: '95vw', sm: 540 },
          maxHeight: '70vh',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'xl',
          boxShadow: 'lg',
          border: '1px solid',
          borderColor: 'divider',
          gap: 0,
        }}
      >
        {/* Search header */}
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Input
            autoFocus
            size="md"
            placeholder="Search chats and projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Search size={16} style={{ opacity: 0.4 }} />
                {searchTerm && (
                  <IconButton
                    size="sm"
                    variant="plain"
                    color="neutral"
                    onClick={() => setSearchTerm('')}
                    sx={{ '--IconButton-size': '20px' }}
                  >
                    <X size={13} />
                  </IconButton>
                )}
              </Stack>
            }
            endDecorator={
              <IconButton
                size="sm"
                variant="plain"
                color="neutral"
                onClick={onClose}
                sx={{ '--IconButton-size': '28px' }}
              >
                <X size={16} />
              </IconButton>
            }
            sx={{
              '--Input-minHeight': '44px',
              border: 'none',
              boxShadow: 'none',
              bgcolor: 'transparent',
              '&::before': { display: 'none' },
              '&:focus-within': { boxShadow: 'none' },
            }}
          />
        </Box>

        {/* Count */}
        <Box sx={{ px: 2.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {filteredSessions.length} chat{filteredSessions.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>
        </Box>

        {/* Chat list */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'neutral.200',
              borderRadius: 3,
            },
          }}
        >
          {filteredSessions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                {searchTerm ? 'No chats found' : 'No chat history yet'}
              </Typography>
            </Box>
          ) : (
            <>
              <ChatSection label="Today" chats={groupedChats.today} currentSessionId={currentSessionId} onSelectChat={onSelectChat} onClose={onClose} />
              <ChatSection label="Yesterday" chats={groupedChats.yesterday} currentSessionId={currentSessionId} onSelectChat={onSelectChat} onClose={onClose} />
              <ChatSection label="Past week" chats={groupedChats.thisWeek} currentSessionId={currentSessionId} onSelectChat={onSelectChat} onClose={onClose} />
              <ChatSection label="Past month" chats={groupedChats.thisMonth} currentSessionId={currentSessionId} onSelectChat={onSelectChat} onClose={onClose} />
              <ChatSection label="Older" chats={groupedChats.older} currentSessionId={currentSessionId} onSelectChat={onSelectChat} onClose={onClose} />
            </>
          )}
        </Box>
      </ModalDialog>
    </Modal>
  );
}
