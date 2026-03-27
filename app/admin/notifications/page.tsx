'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton,
  Select, Option, Input, Modal, ModalDialog, ModalClose, FormControl,
  FormLabel, Textarea, Divider,
} from '@mui/joy';
import {
  Bell, Trash2, Inbox, Send, Info, AlertTriangle, CheckCircle2,
  MousePointerClick, Filter, Plus, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

const TYPE_COLORS: Record<string, 'primary' | 'warning' | 'success' | 'neutral'> = {
  info: 'primary',
  warning: 'warning',
  success: 'success',
  action: 'neutral',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info size={12} />,
  warning: <AlertTriangle size={12} />,
  success: <CheckCircle2 size={12} />,
  action: <MousePointerClick size={12} />,
};

const CATEGORIES = ['invoice', 'bill', 'subscription', 'system', 'support', 'ai'];
const TYPES = ['info', 'warning', 'success', 'action'];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  // Send notification modal
  const [sendOpen, setSendOpen] = useState(false);
  const [sendData, setSendData] = useState({
    userId: '',
    type: 'info',
    title: '',
    message: '',
    category: 'system',
  });
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (readFilter) params.set('read', readFilter);
      const res = await adminFetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, categoryFilter, readFilter]);

  const handleDelete = async (userId: string, notificationId: string) => {
    setDeleting(notificationId);
    try {
      const res = await adminFetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notification deleted');
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setDeleting(null);
    }
  };

  const handleSend = async () => {
    if (!sendData.userId || !sendData.title || !sendData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Notification sent');
      setSendOpen(false);
      setSendData({ userId: '', type: 'info', title: '', message: '', category: 'system' });
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography level="h3" fontWeight={700}>Notifications</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              View and manage notifications across all users.
            </Typography>
          </Box>
          <Button
            size="sm"
            startDecorator={<Plus size={14} />}
            onClick={() => setSendOpen(true)}
            sx={{
              bgcolor: '#D97757',
              '&:hover': { bgcolor: '#c4684a' },
            }}
          >
            Send Notification
          </Button>
        </Stack>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filters</Typography>
              </Stack>
              <Select
                size="sm"
                placeholder="All Types"
                value={typeFilter || null}
                onChange={(_, val) => setTypeFilter(val || '')}
                sx={{ minWidth: 130, fontSize: '12px' }}
              >
                <Option value="">All Types</Option>
                {TYPES.map(t => (
                  <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
                ))}
              </Select>
              <Select
                size="sm"
                placeholder="All Categories"
                value={categoryFilter || null}
                onChange={(_, val) => setCategoryFilter(val || '')}
                sx={{ minWidth: 150, fontSize: '12px' }}
              >
                <Option value="">All Categories</Option>
                {CATEGORIES.map(c => (
                  <Option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</Option>
                ))}
              </Select>
              <Select
                size="sm"
                placeholder="All Status"
                value={readFilter || null}
                onChange={(_, val) => setReadFilter(val || '')}
                sx={{ minWidth: 130, fontSize: '12px' }}
              >
                <Option value="">All Status</Option>
                <Option value="read">Read</Option>
                <Option value="unread">Unread</Option>
              </Select>
            </Stack>
          </CardContent>
        </Card>

        {/* Notifications list */}
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="text" width="35%" />
                        <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 10 }} />
                      </Stack>
                      <Skeleton variant="text" width="70%" sx={{ mt: 0.5 }} />
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Skeleton variant="text" width={120} />
                        <Skeleton variant="rectangular" width={55} height={18} sx={{ borderRadius: 10 }} />
                      </Stack>
                    </Box>
                    <Skeleton variant="rectangular" width={30} height={30} sx={{ borderRadius: 'sm' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : notifications.length === 0 ? (
          <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No notifications found.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </Typography>
            {notifications.map(notif => (
              <Card key={notif.id} sx={{
                ...adminCard as Record<string, unknown>,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'neutral.400' },
                borderLeft: '3px solid',
                borderLeftColor: notif.read
                  ? 'var(--joy-palette-neutral-300)'
                  : 'var(--joy-palette-primary-400)',
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography level="body-sm" fontWeight={600}>
                          {notif.title}
                        </Typography>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={TYPE_COLORS[notif.type] || 'neutral'}
                          startDecorator={TYPE_ICONS[notif.type]}
                          sx={{ fontSize: '10px' }}
                        >
                          {notif.type}
                        </Chip>
                        {!notif.read && (
                          <Box sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            bgcolor: '#D97757', flexShrink: 0,
                          }} />
                        )}
                      </Stack>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>
                        {notif.message?.slice(0, 200)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Mail size={10} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            {notif.userEmail}
                          </Typography>
                        </Stack>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          &bull; {formatDate(notif.createdAt)}
                        </Typography>
                        {notif.category && (
                          <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px' }}>
                            {notif.category}
                          </Chip>
                        )}
                        <Chip
                          size="sm"
                          variant="outlined"
                          color={notif.read ? 'neutral' : 'warning'}
                          sx={{ fontSize: '10px' }}
                        >
                          {notif.read ? 'Read' : 'Unread'}
                        </Chip>
                      </Stack>
                    </Box>
                    <Button
                      size="sm"
                      variant="plain"
                      color="danger"
                      onClick={() => handleDelete(notif.userId, notif.id)}
                      loading={deleting === notif.id}
                      sx={{ minWidth: 32, px: 0.75 }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Send Notification Modal */}
      <Modal open={sendOpen} onClose={() => setSendOpen(false)}>
        <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 480 }, width: '100%' }}>
          <ModalClose />
          <Typography level="title-lg" fontWeight={700}>
            Send Notification
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 1 }}>
            Send a notification to a specific user.
          </Typography>
          <Divider />
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl required>
              <FormLabel>User ID</FormLabel>
              <Input
                size="sm"
                placeholder="Enter user ID"
                value={sendData.userId}
                onChange={e => setSendData(prev => ({ ...prev, userId: e.target.value }))}
              />
            </FormControl>
            <Stack direction="row" spacing={1.5}>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Type</FormLabel>
                <Select
                  size="sm"
                  value={sendData.type}
                  onChange={(_, val) => setSendData(prev => ({ ...prev, type: val || 'info' }))}
                >
                  {TYPES.map(t => (
                    <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Category</FormLabel>
                <Select
                  size="sm"
                  value={sendData.category}
                  onChange={(_, val) => setSendData(prev => ({ ...prev, category: val || 'system' }))}
                >
                  {CATEGORIES.map(c => (
                    <Option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</Option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <FormControl required>
              <FormLabel>Title</FormLabel>
              <Input
                size="sm"
                placeholder="Notification title"
                value={sendData.title}
                onChange={e => setSendData(prev => ({ ...prev, title: e.target.value }))}
              />
            </FormControl>
            <FormControl required>
              <FormLabel>Message</FormLabel>
              <Textarea
                size="sm"
                minRows={3}
                placeholder="Notification message..."
                value={sendData.message}
                onChange={e => setSendData(prev => ({ ...prev, message: e.target.value }))}
              />
            </FormControl>
            <Button
              startDecorator={<Send size={14} />}
              onClick={handleSend}
              loading={sending}
              sx={{
                bgcolor: '#D97757',
                '&:hover': { bgcolor: '#c4684a' },
              }}
            >
              Send Notification
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
