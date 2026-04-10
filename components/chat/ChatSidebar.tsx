'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Dropdown,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/joy';
import {
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Wrench,
  Palette,
  Star,
  Archive,
  Trash2,
  Pencil,
  MoreHorizontal,
  MessageSquare,
  ArchiveRestore,
  Check,
  X,
} from 'lucide-react';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { Chat } from '@/types';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

const PAGE_SIZE = 15;

interface ChatSidebarProps {
  sessions: Chat[];
  currentSessionId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onStarChat: (sessionId: string, isStarred: boolean) => void;
  onArchiveChat: (sessionId: string, isArchived: boolean) => void;
  onOpenSettings: () => void;
  onOpenToolkit?: () => void;
  onOpenCustomize?: () => void;
  isLoadingSessions?: boolean;
}

function getDateGroup(chat: Chat): string {
  const date = chat.lastMessageAt?.toDate?.() ?? new Date();
  if (chat.isStarred) return 'Starred';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return 'This Week';
  if (isThisMonth(date)) return 'This Month';
  return 'Older';
}

const GROUP_ORDER = ['Starred', 'Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

function groupChats(chats: Chat[]): { label: string; chats: Chat[] }[] {
  const map: Record<string, Chat[]> = {};
  for (const chat of chats) {
    const g = getDateGroup(chat);
    if (!map[g]) map[g] = [];
    map[g].push(chat);
  }
  return GROUP_ORDER.filter(g => map[g]?.length).map(g => ({ label: g, chats: map[g] }));
}

function ChatRowSkeleton({ index }: { index: number }) {
  return (
    <Box sx={{ px: 1.5, py: 0.75, mx: 0.5 }}>
      <Box
        sx={{
          height: 13,
          borderRadius: 1,
          bgcolor: 'background.level2',
          width: `${65 + (index % 4) * 8}%`,
          animation: `skeletonPulse 1.5s ease-in-out ${index * 0.1}s infinite`,
          '@keyframes skeletonPulse': {
            '0%, 100%': { opacity: 0.4 },
            '50%': { opacity: 0.8 },
          },
        }}
      />
    </Box>
  );
}

function ChatRow({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onStar,
  onArchive,
}: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onStar: () => void;
  onArchive: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) onRename(trimmed);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') { setRenameValue(chat.title); setIsRenaming(false); }
  };

  const startRename = () => {
    setRenameValue(chat.title);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        cursor: 'pointer',
        borderRadius: 'sm',
        mx: 0.5,
        bgcolor: isActive ? 'primary.softBg' : 'transparent',
        '&:hover': { bgcolor: isActive ? 'primary.softBg' : 'background.level1' },
        transition: 'background 0.1s ease',
      }}
    >
      {isRenaming ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
          <Input
            slotProps={{ input: { ref: renameInputRef } }}
            size="sm"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameSubmit}
            autoFocus
            sx={{ flex: 1, '--Input-minHeight': '28px', fontSize: '13px' }}
          />
          <IconButton size="sm" variant="plain" color="success" onMouseDown={(e) => { e.preventDefault(); handleRenameSubmit(); }}>
            <Check size={13} />
          </IconButton>
          <IconButton size="sm" variant="plain" color="neutral" onMouseDown={(e) => { e.preventDefault(); setRenameValue(chat.title); setIsRenaming(false); }}>
            <X size={13} />
          </IconButton>
        </Box>
      ) : (
        <>
          <Box
            onClick={onSelect}
            sx={{ flex: 1, minWidth: 0, py: 0.75 }}
          >
            <Typography
              level="body-sm"
              fontWeight={isActive ? 600 : 400}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: isActive ? 'primary.700' : 'text.primary',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              {chat.isStarred && (
                <Star
                  size={10}
                  style={{ flexShrink: 0, fill: 'var(--joy-palette-warning-400)', color: 'var(--joy-palette-warning-400)' }}
                />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chat.title}
              </span>
            </Typography>
          </Box>

          {(isHovered || isActive) && (
            <Dropdown>
              <MenuButton
                slots={{ root: IconButton }}
                slotProps={{
                  root: {
                    size: 'sm',
                    variant: 'plain',
                    color: 'neutral',
                    onClick: (e: React.MouseEvent) => e.stopPropagation(),
                    sx: { '--IconButton-size': '22px', flexShrink: 0, opacity: isHovered ? 1 : 0.5 },
                  } as any,
                }}
              >
                <MoreHorizontal size={14} />
              </MenuButton>
              <Menu
                size="sm"
                placement="bottom-end"
                sx={{ zIndex: 1400, minWidth: 160 }}
              >
                <MenuItem
                  onClick={(e) => { e.stopPropagation(); onStar(); }}
                  sx={{ gap: 1 }}
                >
                  <Star size={14} style={chat.isStarred ? { fill: 'var(--joy-palette-warning-400)', color: 'var(--joy-palette-warning-400)' } : {}} />
                  {chat.isStarred ? 'Unstar' : 'Star'}
                </MenuItem>
                <MenuItem
                  onClick={(e) => { e.stopPropagation(); startRename(); }}
                  sx={{ gap: 1 }}
                >
                  <Pencil size={14} />
                  Rename
                </MenuItem>
                <MenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                  sx={{ gap: 1 }}
                >
                  {chat.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  {chat.isArchived ? 'Unarchive' : 'Archive'}
                </MenuItem>
                <MenuItem
                  color="danger"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  sx={{ gap: 1 }}
                >
                  <Trash2 size={14} />
                  Delete
                </MenuItem>
              </Menu>
            </Dropdown>
          )}
        </>
      )}
    </Box>
  );
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
  onStarChat,
  onArchiveChat,
  onOpenSettings,
  onOpenToolkit,
  onOpenCustomize,
  isLoadingSessions = false,
}: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeSessions = sessions.filter(s => !s.isArchived);
  const archivedSessions = sessions.filter(s => s.isArchived);

  const paginatedActive = activeSessions.slice(0, visibleCount);
  const groups = groupChats(paginatedActive);
  const hasMore = activeSessions.length > visibleCount;
  const remaining = activeSessions.length - visibleCount;

  const sidebarWidth = collapsed ? 60 : 248;

  return (
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
        sx={{ px: collapsed ? 1 : 2, py: 1.5, minHeight: 56, flexShrink: 0 }}
      >
        {!collapsed && <FlowBooksLogoJoy iconSize={28} fontSize="1rem" />}
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <IconButton size="sm" variant="plain" onClick={onToggleCollapse} sx={{ borderRadius: 'sm' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* New Chat Button */}
      <Box sx={{ px: collapsed ? 1 : 1.5, pb: 1, flexShrink: 0 }}>
        {collapsed ? (
          <Tooltip title="New Chat" placement="right">
            <IconButton variant="solid" color="primary" onClick={onNewChat} sx={{ width: '100%', borderRadius: 'sm' }}>
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

      {!collapsed && (
        <>
          {/* Search Chats Button */}
          <Box sx={{ px: 1.5, pb: 0.75, flexShrink: 0 }}>
            <Button
              variant="plain"
              color="neutral"
              startDecorator={<Search size={14} />}
              onClick={() => router.push(`/companies/${companyId}/chats`)}
              fullWidth
              sx={{
                borderRadius: 'sm',
                justifyContent: 'flex-start',
                fontWeight: 500,
                fontSize: '13px',
                color: 'text.secondary',
                '--Button-minHeight': '32px',
              }}
            >
              Search Chats
            </Button>
          </Box>

          {/* Toolkit + Customization buttons */}
          <Box sx={{ px: 1.5, pb: 1, flexShrink: 0 }}>
            <Stack direction="row" spacing={0.75}>
              <Button
                variant="outlined"
                color="neutral"
                size="sm"
                startDecorator={<Wrench size={13} />}
                fullWidth
                onClick={onOpenToolkit}
                sx={{
                  borderRadius: 'sm',
                  fontWeight: 500,
                  fontSize: '12px',
                  justifyContent: 'flex-start',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.300', color: 'primary.600', bgcolor: 'primary.softBg' },
                }}
              >
                Toolkit
              </Button>
              <Button
                variant="outlined"
                color="neutral"
                size="sm"
                startDecorator={<Palette size={13} />}
                fullWidth
                onClick={onOpenCustomize}
                sx={{
                  borderRadius: 'sm',
                  fontWeight: 500,
                  fontSize: '12px',
                  justifyContent: 'flex-start',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.300', color: 'primary.600', bgcolor: 'primary.softBg' },
                }}
              >
                Customize
              </Button>
            </Stack>
          </Box>
        </>
      )}

      <Divider sx={{ flexShrink: 0 }} />

      {/* Chat list area */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
        {collapsed ? (
          <Stack spacing={0.5} sx={{ px: 1, pt: 0.5 }}>
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
            <Tooltip title="Chats" placement="right">
              <IconButton variant="plain" color="neutral" sx={{ width: '100%', borderRadius: 'sm' }}>
                <MessageSquare size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archived" placement="right">
              <IconButton variant="plain" color="neutral" sx={{ width: '100%', borderRadius: 'sm' }}>
                <Archive size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <>
            {/* Chats Accordion */}
            <Accordion
              expanded={chatsOpen}
              onChange={(_, expanded) => setChatsOpen(expanded)}
              sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
            >
              <AccordionSummary
                indicator={<ChevronDown size={13} />}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  minHeight: 30,
                  '& .MuiAccordionSummary-button': { gap: 0.5 },
                  '&:hover': { bgcolor: 'background.level1' },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1 }}>
                  <Typography
                    level="body-xs"
                    sx={{
                      color: 'text.tertiary',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontSize: '10px',
                    }}
                  >
                    Chats
                  </Typography>
                  {activeSessions.length > 0 && (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '11px' }}>
                      {activeSessions.length}
                    </Typography>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {isLoadingSessions ? (
                  <Box>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <ChatRowSkeleton key={i} index={i} />
                    ))}
                  </Box>
                ) : activeSessions.length === 0 ? (
                  <Box sx={{ px: 2, py: 2.5, textAlign: 'center' }}>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      No chats yet
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {groups.map(group => (
                      <Box key={group.label}>
                        {/* Group label */}
                        <Typography
                          level="body-xs"
                          sx={{
                            px: 1.5,
                            pt: 1,
                            pb: 0.25,
                            color: 'text.tertiary',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          {group.label === 'Starred' && (
                            <Star
                              size={9}
                              style={{ fill: 'var(--joy-palette-warning-400)', color: 'var(--joy-palette-warning-400)' }}
                            />
                          )}
                          {group.label}
                        </Typography>
                        {group.chats.map(chat => (
                          <ChatRow
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === currentSessionId}
                            onSelect={() => onSelectChat(chat.id)}
                            onDelete={() => onDeleteChat(chat.id)}
                            onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                            onStar={() => onStarChat(chat.id, !chat.isStarred)}
                            onArchive={() => onArchiveChat(chat.id, true)}
                          />
                        ))}
                      </Box>
                    ))}

                    {/* Load more */}
                    {hasMore && (
                      <Box sx={{ px: 1.5, pt: 0.75, pb: 0.5 }}>
                        <Button
                          variant="plain"
                          color="neutral"
                          size="sm"
                          fullWidth
                          onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                          sx={{
                            borderRadius: 'sm',
                            fontSize: '12px',
                            color: 'text.tertiary',
                            fontWeight: 400,
                            '&:hover': { color: 'text.secondary' },
                          }}
                        >
                          Load {Math.min(PAGE_SIZE, remaining)} more...
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Archived Accordion */}
            {archivedSessions.length > 0 && (
              <Accordion
                expanded={archivedOpen}
                onChange={(_, expanded) => setArchivedOpen(expanded)}
                sx={{ bgcolor: 'transparent', boxShadow: 'none', mt: 0.5 }}
              >
                <AccordionSummary
                  indicator={<ChevronDown size={13} />}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    minHeight: 30,
                    '& .MuiAccordionSummary-button': { gap: 0.5 },
                    '&:hover': { bgcolor: 'background.level1' },
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1 }}>
                    <Archive size={11} style={{ opacity: 0.45 }} />
                    <Typography
                      level="body-xs"
                      sx={{
                        color: 'text.tertiary',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: '10px',
                      }}
                    >
                      Archived
                    </Typography>
                    {archivedSessions.length > 0 && (
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '11px' }}>
                        {archivedSessions.length}
                      </Typography>
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {archivedSessions.map(chat => (
                    <ChatRow
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === currentSessionId}
                      onSelect={() => onSelectChat(chat.id)}
                      onDelete={() => onDeleteChat(chat.id)}
                      onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                      onStar={() => onStarChat(chat.id, !chat.isStarred)}
                      onArchive={() => onArchiveChat(chat.id, false)}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}
      </Box>

      <Divider sx={{ flexShrink: 0 }} />

      {/* Settings Button */}
      <Box sx={{ p: collapsed ? 1 : 1.5, flexShrink: 0 }}>
        {collapsed ? (
          <Tooltip title="Settings" placement="right">
            <IconButton variant="plain" color="neutral" onClick={onOpenSettings} sx={{ width: '100%', borderRadius: 'sm' }}>
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
            sx={{ borderRadius: 'sm', justifyContent: 'flex-start' }}
          >
            Settings
          </Button>
        )}
      </Box>
    </Box>
  );
}
