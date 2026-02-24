'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Input,
  Button,
  Checkbox,
  Stack,
  IconButton,
  Chip,
  Divider,
  Skeleton,
} from '@mui/joy';
import {
  Search,
  Plus,
  Trash2,
  X,
  MessageSquare,
  MessagesSquare,
  Edit2,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { getChats, deleteChat, updateChat } from '@/services/chats';
import { ConfirmDialog } from '@/components/common';
import { Chat } from '@/types';
import toast from 'react-hot-toast';

export default function ChatsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user } = useAuth();
  const { company } = useCompany();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load chats
  useEffect(() => {
    async function load() {
      if (!companyId || !user?.uid) return;
      try {
        const data = await getChats(companyId, user.uid);
        setChats(data);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyId, user?.uid]);

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    const lower = searchTerm.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(lower));
  }, [chats, searchTerm]);

  const allSelected = filteredChats.length > 0 && filteredChats.every((c) => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredChats.map((c) => c.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await deleteChat(companyId, id);
      }
      setChats((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      toast.success(`Deleted ${ids.length} chat${ids.length !== 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast.error('Failed to delete some chats');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleRename = async (chatId: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await updateChat(companyId, chatId, { title: renameValue.trim() });
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: renameValue.trim() } : c)));
      toast.success('Chat renamed');
    } catch (error) {
      toast.error('Failed to rename');
    }
    setRenamingId(null);
  };

  const handleOpenChat = (chatId: string) => {
    if (selectMode) {
      toggleSelect(chatId);
      return;
    }
    router.push(`/companies/${companyId}/chat/${chatId}`);
  };

  const getTimeAgo = (chat: Chat) => {
    const date = chat.lastMessageAt?.toDate?.() || new Date();
    return `Last message ${formatDistanceToNow(date, { addSuffix: false })} ago`;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Typography level="h3" fontWeight={700}>
            Chats
          </Typography>
          <Button
            size="sm"
            variant="outlined"
            color="neutral"
            startDecorator={<Plus size={16} />}
            onClick={() => router.push(`/companies/${companyId}/chat`)}
            sx={{ borderRadius: 'lg' }}
          >
            New chat
          </Button>
        </Stack>

        {/* Search */}
        <Input
          size="sm"
          placeholder="Search your chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startDecorator={<Search size={16} style={{ opacity: 0.4 }} />}
          endDecorator={
            searchTerm && (
              <IconButton size="sm" variant="plain" onClick={() => setSearchTerm('')} sx={{ '--IconButton-size': '22px' }}>
                <X size={14} />
              </IconButton>
            )
          }
          sx={{
            '--Input-minHeight': '40px',
            borderRadius: 'lg',
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'neutral.200',
          }}
        />
      </Box>

      {/* Toolbar */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>

          {!selectMode ? (
            <Button
              size="sm"
              variant="plain"
              color="primary"
              onClick={() => setSelectMode(true)}
              disabled={filteredChats.length === 0}
            >
              Select
            </Button>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {selectedIds.size > 0 && (
                <Chip size="sm" variant="soft" color="primary">
                  {selectedIds.size} selected
                </Chip>
              )}
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                onClick={toggleSelectAll}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  variant="soft"
                  color="danger"
                  startDecorator={<Trash2 size={14} />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
              )}
              <Button size="sm" variant="plain" color="neutral" onClick={exitSelectMode}>
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Chat list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Stack spacing={0} sx={{ pt: 1 }}>
            {[...Array(8)].map((_, i) => (
              <Box key={i} sx={{ px: { xs: 2, sm: 4 }, py: 1.5 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
              </Box>
            ))}
          </Stack>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'neutral.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MessagesSquare size={26} style={{ opacity: 0.35 }} />
            </Box>
            <Typography level="title-sm" sx={{ color: 'text.secondary' }}>
              {searchTerm ? 'No chats found' : 'No chats yet'}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5, mb: 2 }}>
              {searchTerm ? 'Try a different search term' : 'Start a conversation with Flow AI'}
            </Typography>
            {!searchTerm && (
              <Button
                size="sm"
                variant="soft"
                startDecorator={<Plus size={14} />}
                onClick={() => router.push(`/companies/${companyId}/chat`)}
              >
                New chat
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={0}>
            {filteredChats.map((chat) => {
              const isSelected = selectedIds.has(chat.id);
              const isRenaming = renamingId === chat.id;

              return (
                <Box
                  key={chat.id}
                  onClick={() => !isRenaming && handleOpenChat(chat.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: { xs: 2, sm: 4 },
                    py: 1.75,
                    cursor: isRenaming ? 'default' : 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'background 0.1s',
                    bgcolor: isSelected ? 'primary.softBg' : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.softBg' : 'neutral.softBg',
                    },
                  }}
                >
                  {/* Checkbox (select mode) */}
                  {selectMode && (
                    <Checkbox
                      size="sm"
                      checked={isSelected}
                      onChange={() => toggleSelect(chat.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ flexShrink: 0 }}
                    />
                  )}

                  {/* Icon */}
                  <MessageSquare size={18} style={{ flexShrink: 0, opacity: 0.3 }} />

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isRenaming ? (
                      <Input
                        size="sm"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(chat.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ '--Input-minHeight': '28px' }}
                      />
                    ) : (
                      <>
                        <Typography
                          level="body-md"
                          fontWeight={500}
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {chat.title}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                          {getTimeAgo(chat)}
                        </Typography>
                      </>
                    )}
                  </Box>

                  {/* Actions */}
                  {!selectMode && !isRenaming && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ flexShrink: 0 }}
                    >
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(chat.id);
                          setRenameValue(chat.title);
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
                          setSelectedIds(new Set([chat.id]));
                          setDeleteConfirmOpen(true);
                        }}
                        sx={{ '--IconButton-size': '28px' }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); if (!selectMode) setSelectedIds(new Set()); }}
        onConfirm={handleDeleteSelected}
        title={`Delete ${selectedIds.size} chat${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This will permanently delete the selected conversations and all their messages. This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        variant="danger"
      />
    </Box>
  );
}
