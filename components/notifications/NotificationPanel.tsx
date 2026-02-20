'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Button, IconButton, Divider, Sheet, Chip,
} from '@mui/joy';
import { X, CheckCheck, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getNotifications, markAsRead, markAllAsRead, deleteNotification,
} from '@/services/notifications';
import NotificationItem from './NotificationItem';
import type { AppNotification } from '@/types/notification';

type FilterTab = 'all' | 'unread' | 'read';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    if (!open || !user?.uid) return;
    setLoading(true);
    getNotifications(user.uid)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, user?.uid]);

  const handleMarkRead = async (id: string) => {
    if (!user?.uid) return;
    await markAsRead(user.uid, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    await markAllAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    await deleteNotification(user.uid, id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = (notification: AppNotification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: AppNotification[] }[] = [];
  const todayItems = filtered.filter(n => {
    const d = n.createdAt?.toDate?.() || new Date(0);
    return d >= today;
  });
  const yesterdayItems = filtered.filter(n => {
    const d = n.createdAt?.toDate?.() || new Date(0);
    return d >= yesterday && d < today;
  });
  const earlierItems = filtered.filter(n => {
    const d = n.createdAt?.toDate?.() || new Date(0);
    return d < yesterday;
  });

  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (earlierItems.length) groups.push({ label: 'Earlier', items: earlierItems });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 1200, transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Panel */}
      <Sheet
        sx={{
          position: 'fixed',
          top: 0,
          right: open ? 0 : -380,
          width: 380,
          height: '100vh',
          zIndex: 1300,
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.25s ease-in-out',
          boxShadow: open ? 'lg' : 'none',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography level="title-lg" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip size="sm" variant="solid" color="primary">{unreadCount}</Chip>
            )}
          </Stack>
          <IconButton size="sm" variant="plain" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>

        {/* Filter Tabs */}
        <Stack direction="row" spacing={1} sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          {(['all', 'unread', 'read'] as FilterTab[]).map(tab => (
            <Chip
              key={tab}
              size="sm"
              variant={filter === tab ? 'solid' : 'soft'}
              color={filter === tab ? 'primary' : 'neutral'}
              onClick={() => setFilter(tab)}
              sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {tab}
            </Chip>
          ))}
        </Stack>

        {/* Notification List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {loading ? (
            <Typography level="body-sm" sx={{ textAlign: 'center', py: 4, color: 'text.tertiary' }}>
              Loading...
            </Typography>
          ) : filtered.length === 0 ? (
            <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
              <Bell size={32} style={{ color: 'var(--joy-palette-neutral-300)' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              {groups.map(group => (
                <Box key={group.label}>
                  <Typography level="body-xs" sx={{
                    color: 'text.tertiary', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', px: 1, py: 0.75,
                  }}>
                    {group.label}
                  </Typography>
                  {group.items.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      onClick={handleClick}
                    />
                  ))}
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        {unreadCount > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="soft"
              color="neutral"
              size="sm"
              fullWidth
              startDecorator={<CheckCheck size={14} />}
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
          </Box>
        )}
      </Sheet>
    </>
  );
}
