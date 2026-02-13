'use client';

import { useState, useMemo } from 'react';
import {
  Modal,
  ModalDialog,
  ModalClose,
  Box,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Stack,
  Typography,
  IconButton,
  Divider,
} from '@mui/joy';
import { Search, MessageSquare, Trash2, Edit2, X, Check } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
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
  const groups: GroupedChats = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  chats.forEach((chat) => {
    const date = chat.lastMessageAt?.toDate?.() || new Date();

    if (isToday(date)) {
      groups.today.push(chat);
    } else if (isYesterday(date)) {
      groups.yesterday.push(chat);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(chat);
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(chat);
    } else {
      groups.older.push(chat);
    }
  });

  return groups;
}

function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [showActions, setShowActions] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  const date = chat.lastMessageAt?.toDate?.() || new Date();

  return (
    <ListItem
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <ListItemButton
        selected={isActive}
        onClick={isEditing ? undefined : onSelect}
        sx={{
          borderRadius: 'md',
          py: 1.5,
          px: 2,
          gap: 1.5,
          '&.Mui-selected': {
            bgcolor: 'primary.softBg',
            '&:hover': {
              bgcolor: 'primary.softHoverBg',
            },
          },
        }}
      >
        <MessageSquare size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
        <ListItemContent sx={{ minWidth: 0 }}>
          {isEditing ? (
            <Input
              size="sm"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              sx={{ '--Input-minHeight': '28px' }}
            />
          ) : (
            <>
              <Typography level="body-sm" noWrap fontWeight="md">
                {chat.title}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                {format(date, 'MMM d, h:mm a')}
              </Typography>
            </>
          )}
        </ListItemContent>

        {showActions && !isEditing && (
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditTitle(chat.title);
              }}
              sx={{ '--IconButton-size': '28px' }}
            >
              <Edit2 size={14} />
            </IconButton>
            <IconButton
              size="sm"
              variant="plain"
              color="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              sx={{ '--IconButton-size': '28px' }}
            >
              <Trash2 size={14} />
            </IconButton>
          </Stack>
        )}
      </ListItemButton>
    </ListItem>
  );
}

function ChatGroup({
  label,
  chats,
  currentSessionId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onClose,
}: {
  label: string;
  chats: Chat[];
  currentSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onClose: () => void;
}) {
  if (chats.length === 0) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        level="body-xs"
        sx={{
          px: 2,
          py: 0.75,
          color: 'text.tertiary',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      <List size="sm" sx={{ '--List-padding': '0px', '--ListItem-paddingY': '2px', '--ListItem-paddingX': '8px' }}>
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === currentSessionId}
            onSelect={() => {
              onSelectChat(chat.id);
              onClose();
            }}
            onDelete={() => onDeleteChat(chat.id)}
            onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
          />
        ))}
      </List>
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
        variant="outlined"
        sx={{
          width: 480,
          maxHeight: '80vh',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'lg',
        }}
      >
        {/* Header with search */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography level="title-lg">Chat History</Typography>
            <ModalClose sx={{ position: 'static' }} />
          </Stack>
          <Input
            size="sm"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<Search size={16} />}
            endDecorator={
              searchTerm && (
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => setSearchTerm('')}
                  sx={{ '--IconButton-size': '20px' }}
                >
                  <X size={14} />
                </IconButton>
              )
            }
            sx={{
              borderRadius: 'md',
              '--Input-focusedHighlight': 'var(--joy-palette-primary-400)',
            }}
          />
        </Box>

        {/* Chat list */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            py: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'neutral.300',
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
              <ChatGroup
                label="Today"
                chats={groupedChats.today}
                currentSessionId={currentSessionId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onClose={onClose}
              />
              <ChatGroup
                label="Yesterday"
                chats={groupedChats.yesterday}
                currentSessionId={currentSessionId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onClose={onClose}
              />
              <ChatGroup
                label="Previous 7 Days"
                chats={groupedChats.thisWeek}
                currentSessionId={currentSessionId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onClose={onClose}
              />
              <ChatGroup
                label="This Month"
                chats={groupedChats.thisMonth}
                currentSessionId={currentSessionId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onClose={onClose}
              />
              <ChatGroup
                label="Older"
                chats={groupedChats.older}
                currentSessionId={currentSessionId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onClose={onClose}
              />
            </>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
