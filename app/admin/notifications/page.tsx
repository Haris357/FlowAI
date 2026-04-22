'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton,
  Modal, ModalDialog, ModalClose, Sheet, Table, IconButton, Tooltip,
  Select, Option, Input, Divider, FormControl, FormLabel, Textarea,
} from '@mui/joy';
import {
  Bell, Trash2, Inbox, Send, Info, AlertTriangle, CheckCircle2,
  MousePointerClick, Filter, Plus, Search, RefreshCw, Mail,
  AlertCircle, Eye, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

type ChipColor = 'primary' | 'warning' | 'success' | 'neutral' | 'danger';
const TYPE_COLORS: Record<string, ChipColor> = {
  info: 'primary', warning: 'warning', success: 'success', action: 'neutral',
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info size={10} />,
  warning: <AlertTriangle size={10} />,
  success: <CheckCircle2 size={10} />,
  action: <MousePointerClick size={10} />,
};

const CATEGORIES = ['invoice', 'bill', 'subscription', 'system', 'support', 'ai', 'announcement'];
const TYPES = ['info', 'warning', 'success', 'action'];

interface NotifRow {
  id: string;
  userId: string;
  userEmail?: string;
  title?: string;
  message?: string;
  type?: string;
  category?: string;
  read?: boolean;
  actionUrl?: string;
  createdAt?: any;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [sendOpen, setSendOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<NotifRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<NotifRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (readFilter) params.set('read', readFilter);
      const res = await adminFetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      setNotifs(data.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [typeFilter, categoryFilter, readFilter]);
  useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter, readFilter, pageSize]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await adminFetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteConfirm.userId, notificationId: deleteConfirm.id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notification deleted');
      setNotifs(prev => prev.filter(n => n.id !== deleteConfirm.id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return notifs;
    const q = search.toLowerCase();
    return notifs.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.message || '').toLowerCase().includes(q) ||
      (n.userEmail || '').toLowerCase().includes(q)
    );
  }, [notifs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bell size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Notifications</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {unreadCount} unread · {notifs.length} total across all users
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="sm" variant="outlined" color="neutral"
              startDecorator={<RefreshCw size={14} />}
              onClick={load} loading={loading}
              sx={{ borderRadius: '10px' }}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              startDecorator={<Plus size={14} />}
              onClick={() => setSendOpen(true)}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              Send notification
            </Button>
          </Stack>
        </Stack>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filters</Typography>
              </Stack>
              <Input
                size="sm"
                placeholder="Search title, message, user…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm" placeholder="All Types" value={typeFilter || ''}
                onChange={(_, v) => setTypeFilter(v || '')}
                sx={{ minWidth: 120, borderRadius: '8px' }}
              >
                <Option value="">All Types</Option>
                {TYPES.map(t => <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>)}
              </Select>
              <Select
                size="sm" placeholder="All Categories" value={categoryFilter || ''}
                onChange={(_, v) => setCategoryFilter(v || '')}
                sx={{ minWidth: 150, borderRadius: '8px' }}
              >
                <Option value="">All Categories</Option>
                {CATEGORIES.map(c => <Option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</Option>)}
              </Select>
              <Select
                size="sm" placeholder="All Status" value={readFilter || ''}
                onChange={(_, v) => setReadFilter(v || '')}
                sx={{ minWidth: 120, borderRadius: '8px' }}
              >
                <Option value="">All Status</Option>
                <Option value="read">Read</Option>
                <Option value="unread">Unread</Option>
              </Select>
              {(search || typeFilter || categoryFilter || readFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setTypeFilter(''); setCategoryFilter(''); setReadFilter(''); }}
                >
                  Clear
                </Chip>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table hoverRow stickyHeader sx={{
              '& thead th': {
                py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                bgcolor: 'background.surface',
              },
              '& tbody td': { py: 1.5, verticalAlign: 'middle' },
              minWidth: 900,
            }}>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}></th>
                  <th>Title · Message</th>
                  <th style={{ width: '7rem' }}>Type</th>
                  <th style={{ width: '8rem' }}>Category</th>
                  <th style={{ width: '13rem' }}>User</th>
                  <th style={{ width: '7rem' }}>Date</th>
                  <th style={{ width: '7rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="circular" width={8} height={8} /></td>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width="70%" /></td>
                      <td><Skeleton variant="text" width={60} /></td>
                      <td><Skeleton variant="text" width={60} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || typeFilter || categoryFilter || readFilter
                            ? 'No notifications match your filters.'
                            : 'No notifications yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(n => (
                    <tr key={n.id}>
                      <td>
                        {!n.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97757' }} />
                        )}
                      </td>
                      <td>
                        <Box onClick={() => setDetailModal(n)} sx={{ cursor: 'pointer', minWidth: 0 }}>
                          <Typography level="body-sm" fontWeight={n.read ? 500 : 700} noWrap>
                            {n.title || '(untitled)'}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                            {(n.message || '').slice(0, 100)}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        {n.type ? (
                          <Chip
                            size="sm" variant="soft"
                            color={TYPE_COLORS[n.type] || 'neutral'}
                            startDecorator={TYPE_ICONS[n.type]}
                            sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                          >
                            {n.type}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td>
                        {n.category ? (
                          <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '0.68rem' }}>
                            {n.category}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td>
                        <Typography level="body-xs" fontWeight={500} noWrap>
                          {n.userEmail || n.userId}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {formatDate(n.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title="View details">
                            <IconButton size="sm" variant="plain" color="neutral" onClick={() => setDetailModal(n)}>
                              <Eye size={14} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="sm" variant="plain" color="danger" onClick={() => setDeleteConfirm(n)}>
                              <Trash2 size={14} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Sheet>

          {!loading && filtered.length > 0 && (
            <PaginationFooter
              startIdx={startIdx} endIdx={endIdx} total={filtered.length}
              pageSize={pageSize} setPageSize={setPageSize}
              currentPage={currentPage} totalPages={totalPages} setPage={setPage}
            />
          )}
        </Card>
      </Stack>

      {/* Send notification modal */}
      {sendOpen && (
        <SendNotificationModal
          onClose={() => setSendOpen(false)}
          onSent={() => { setSendOpen(false); load(); }}
        />
      )}

      {/* Detail modal */}
      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 500 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                bgcolor: `${TYPE_COLORS[detailModal.type || ''] || 'neutral'}.softBg`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={18} style={{ color: `var(--joy-palette-${TYPE_COLORS[detailModal.type || ''] || 'neutral'}-500)` }} />
              </Box>
              <Box>
                <Typography level="title-lg" fontWeight={700}>{detailModal.title}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                  {detailModal.type && (
                    <Chip size="sm" variant="soft" color={TYPE_COLORS[detailModal.type]}>{detailModal.type}</Chip>
                  )}
                  {detailModal.category && (
                    <Chip size="sm" variant="outlined" color="neutral">{detailModal.category}</Chip>
                  )}
                  <Chip size="sm" variant="soft" color={detailModal.read ? 'neutral' : 'warning'}>
                    {detailModal.read ? 'Read' : 'Unread'}
                  </Chip>
                </Stack>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{
              p: 1.5, borderRadius: '8px', bgcolor: 'background.level1',
              border: '1px solid', borderColor: 'divider',
            }}>
              <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>{detailModal.message}</Typography>
            </Box>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1}>
                <Mail size={14} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Sent to {detailModal.userEmail || detailModal.userId}
                </Typography>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                {formatDate(detailModal.createdAt)}
              </Typography>
              {detailModal.actionUrl && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary', wordBreak: 'break-all' }}>
                  Action URL: <code>{detailModal.actionUrl}</code>
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>Close</Button>
              <Button
                color="danger" variant="soft"
                startDecorator={<Trash2 size={14} />}
                onClick={() => { setDeleteConfirm(detailModal); setDetailModal(null); }}
                sx={{ borderRadius: '10px' }}
              >
                Delete
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 400 }, width: '100%', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={18} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>Delete notification?</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Remove <strong>{deleteConfirm.title}</strong> from the user's feed.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
              <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                color="danger" loading={deleting}
                startDecorator={<Trash2 size={14} />}
                onClick={handleDelete}
                sx={{ borderRadius: '10px' }}
              >
                Delete
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}

// ============================================================
// Send Notification Modal
// ============================================================

function SendNotificationModal({
  onClose, onSent,
}: { onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({
    userId: '', type: 'info', title: '', message: '', category: 'system',
  });
  const [sending, setSending] = useState(false);

  const canSend = form.userId.trim() && form.title.trim() && form.message.trim();

  const handleSend = async () => {
    if (!canSend) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Notification sent');
      onSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 500 }, width: '100%', borderRadius: '16px' }}>
        <ModalClose />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFF0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={18} color="#D97757" />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>Send notification</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Send an in-app notification to a specific user.
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>User ID</FormLabel>
            <Input
              size="sm" value={form.userId}
              onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              placeholder="Firestore user document id"
              sx={{ borderRadius: '8px' }}
            />
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Copy from the Users page &rarr; user detail URL.
            </Typography>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl required sx={{ flex: 1 }}>
              <FormLabel>Type</FormLabel>
              <Select
                size="sm" value={form.type}
                onChange={(_, v) => v && setForm(f => ({ ...f, type: v }))}
                sx={{ borderRadius: '8px' }}
              >
                {TYPES.map(t => <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>)}
              </Select>
            </FormControl>
            <FormControl required sx={{ flex: 1 }}>
              <FormLabel>Category</FormLabel>
              <Select
                size="sm" value={form.category}
                onChange={(_, v) => v && setForm(f => ({ ...f, category: v }))}
                sx={{ borderRadius: '8px' }}
              >
                {CATEGORIES.map(c => <Option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</Option>)}
              </Select>
            </FormControl>
          </Stack>
          <FormControl required>
            <FormLabel>Title</FormLabel>
            <Input
              size="sm" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Notification title"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
          <FormControl required>
            <FormLabel>Message</FormLabel>
            <Textarea
              minRows={3} maxRows={6}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Notification message…"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            startDecorator={<Send size={14} />}
            loading={sending}
            disabled={!canSend}
            onClick={handleSend}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
          >
            Send notification
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
