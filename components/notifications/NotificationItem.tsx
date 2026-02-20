'use client';
import { Box, Typography, Stack, IconButton, Chip } from '@mui/joy';
import { Info, AlertTriangle, CheckCircle, Zap, X } from 'lucide-react';
import type { AppNotification } from '@/types/notification';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: 'var(--joy-palette-primary-500)' },
  warning: { icon: AlertTriangle, color: 'var(--joy-palette-warning-500)' },
  success: { icon: CheckCircle, color: 'var(--joy-palette-success-500)' },
  action: { icon: Zap, color: 'var(--joy-palette-primary-500)' },
};

const CATEGORY_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  invoice: 'primary',
  bill: 'warning',
  subscription: 'success',
  system: 'neutral',
  support: 'primary',
  ai: 'danger',
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: AppNotification) => void;
}

export default function NotificationItem({ notification, onMarkRead, onDelete, onClick }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  const timeAgo = (ts: any): string => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
        onClick?.(notification);
      }}
      sx={{
        p: 1.5,
        borderRadius: 'sm',
        cursor: 'pointer',
        bgcolor: notification.read ? 'transparent' : 'primary.50',
        '&:hover': { bgcolor: notification.read ? 'neutral.50' : 'primary.100' },
        position: 'relative',
        transition: 'background-color 0.15s',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: notification.read ? 'neutral.100' : 'primary.softBg',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, mt: 0.25,
        }}>
          <Icon size={14} style={{ color: config.color }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" fontWeight={notification.read ? 400 : 600} noWrap>
            {notification.title}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }} noWrap>
            {notification.message}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {timeAgo(notification.createdAt)}
            </Typography>
            <Chip
              size="sm"
              variant="soft"
              color={CATEGORY_COLORS[notification.category] || 'neutral'}
              sx={{ fontSize: '9px', height: 18 }}
            >
              {notification.category}
            </Chip>
          </Stack>
        </Box>

        <IconButton
          size="sm"
          variant="plain"
          color="neutral"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          sx={{ opacity: 0.5, '&:hover': { opacity: 1 }, flexShrink: 0 }}
        >
          <X size={14} />
        </IconButton>
      </Stack>

      {/* Unread dot */}
      {!notification.read && (
        <Box sx={{
          position: 'absolute', top: 8, right: 8,
          width: 6, height: 6, borderRadius: '50%',
          bgcolor: 'primary.500',
        }} />
      )}
    </Box>
  );
}
