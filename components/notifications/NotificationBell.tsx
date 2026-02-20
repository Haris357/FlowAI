'use client';
import { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/joy';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount } from '@/services/notifications';

interface NotificationBellProps {
  onClick: () => void;
  collapsed?: boolean;
}

export default function NotificationBell({ onClick, collapsed }: NotificationBellProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchCount = () => {
      getUnreadCount(user.uid).then(setUnreadCount).catch(console.error);
    };

    fetchCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const button = (
    <IconButton
      variant="soft"
      size="sm"
      onClick={onClick}
      sx={{ position: 'relative' }}
    >
      <Badge
        badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 0}
        color="danger"
        size="sm"
        invisible={unreadCount === 0}
      >
        <Bell size={16} />
      </Badge>
    </IconButton>
  );

  if (collapsed) {
    return (
      <Tooltip title="Notifications" placement="right">
        {button}
      </Tooltip>
    );
  }

  return button;
}
