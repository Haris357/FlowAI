'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Input,
  Textarea, FormControl, FormLabel, Select, Option, Checkbox, Skeleton,
  Divider, Modal, ModalDialog, ModalClose, Sheet, Table, IconButton, Tooltip,
  CircularProgress,
} from '@mui/joy';
import {
  Megaphone, Send, Inbox, Users, Mail, Info, AlertTriangle, CheckCircle,
  Zap, Sparkles, Plus, Search, Filter, RefreshCw, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

type AnnouncementType = 'info' | 'warning' | 'success' | 'action';
type TargetAudience = 'all' | 'free_users' | 'pro_users' | 'max_users';
type ChipColor = 'primary' | 'warning' | 'success' | 'danger' | 'neutral';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  target: TargetAudience;
  actionUrl?: string;
  sendEmail: boolean;
  recipientCount: number;
  createdAt: any;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: ChipColor; icon: typeof Info }> = {
  info:    { label: 'Info',    color: 'primary', icon: Info },
  warning: { label: 'Warning', color: 'warning', icon: AlertTriangle },
  success: { label: 'Success', color: 'success', icon: CheckCircle },
  action:  { label: 'Action',  color: 'danger',  icon: Zap },
};

const TARGET_LABELS: Record<TargetAudience, string> = {
  all: 'All Users',
  free_users: 'Free Users',
  pro_users: 'Pro Users',
  max_users: 'Max Users',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Announcement | null>(null);

  const load = () => {
    setLoading(true);
    adminFetch('/api/admin/announcements')
      .then(r => r.json())
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, typeFilter, targetFilter, pageSize]);

  const filtered = useMemo(() => {
    return announcements.filter(a => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (targetFilter && a.target !== targetFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.message.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [announcements, search, typeFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const totalRecipients = announcements.reduce((sum, a) => sum + (a.recipientCount || 0), 0);

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
              <Megaphone size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Announcements</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {announcements.length} sent · {totalRecipients.toLocaleString()} total recipients
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
              onClick={() => setComposeOpen(true)}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              New announcement
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
                placeholder="Search title, message…"
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
                {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => (
                  <Option key={t} value={t}>{TYPE_CONFIG[t].label}</Option>
                ))}
              </Select>
              <Select
                size="sm" placeholder="All Targets" value={targetFilter || ''}
                onChange={(_, v) => setTargetFilter(v || '')}
                sx={{ minWidth: 130, borderRadius: '8px' }}
              >
                <Option value="">All Targets</Option>
                {(Object.keys(TARGET_LABELS) as TargetAudience[]).map(t => (
                  <Option key={t} value={t}>{TARGET_LABELS[t]}</Option>
                ))}
              </Select>
              {(search || typeFilter || targetFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setTypeFilter(''); setTargetFilter(''); }}
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
                  <th>Title · Message</th>
                  <th style={{ width: '8rem' }}>Type</th>
                  <th style={{ width: '9rem' }}>Target</th>
                  <th style={{ width: '7rem', textAlign: 'center' }}>Recipients</th>
                  <th style={{ width: '5rem', textAlign: 'center' }}>Email</th>
                  <th style={{ width: '7rem' }}>Sent</th>
                  <th style={{ width: '5rem', textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width="85%" /></td>
                      <td><Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={80} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={40} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="circular" width={16} height={16} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={30} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || typeFilter || targetFilter ? 'No announcements match your filters.' : 'No announcements sent yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(a => {
                    const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
                    const Icon = cfg.icon;
                    return (
                      <tr key={a.id}>
                        <td>
                          <Box onClick={() => setDetailModal(a)} sx={{ cursor: 'pointer', minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={600} noWrap>{a.title}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                              {a.message.slice(0, 100)}
                            </Typography>
                          </Box>
                        </td>
                        <td>
                          <Chip
                            size="sm" variant="soft" color={cfg.color}
                            startDecorator={<Icon size={10} />}
                            sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                          >
                            {cfg.label}
                          </Chip>
                        </td>
                        <td>
                          <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '0.68rem' }}>
                            {TARGET_LABELS[a.target] || a.target}
                          </Chip>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Typography level="body-sm" fontWeight={600}>
                            {a.recipientCount?.toLocaleString() || 0}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {a.sendEmail ? (
                            <Tooltip title="Sent via email">
                              <Mail size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
                            </Tooltip>
                          ) : (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>
                          )}
                        </td>
                        <td>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {formatDate(a.createdAt)}
                          </Typography>
                        </td>
                        <td>
                          <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title="View details">
                              <IconButton size="sm" variant="plain" color="neutral" onClick={() => setDetailModal(a)}>
                                <Eye size={14} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })
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

      {composeOpen && (
        <ComposeAnnouncementModal
          onClose={() => setComposeOpen(false)}
          onSent={() => { setComposeOpen(false); load(); }}
        />
      )}

      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 520 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px',
                bgcolor: `${TYPE_CONFIG[detailModal.type]?.color || 'primary'}.softBg`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Megaphone size={18} style={{ color: `var(--joy-palette-${TYPE_CONFIG[detailModal.type]?.color || 'primary'}-500)` }} />
              </Box>
              <Box>
                <Typography level="title-lg" fontWeight={700}>{detailModal.title}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                  <Chip size="sm" variant="soft" color={TYPE_CONFIG[detailModal.type]?.color || 'neutral'}>
                    {TYPE_CONFIG[detailModal.type]?.label || detailModal.type}
                  </Chip>
                  <Chip size="sm" variant="outlined">{TARGET_LABELS[detailModal.target] || detailModal.target}</Chip>
                  <Chip size="sm" variant="soft" color="neutral">
                    {detailModal.recipientCount?.toLocaleString() || 0} recipients
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
            {detailModal.actionUrl && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 2, wordBreak: 'break-all' }}>
                Action URL: <code>{detailModal.actionUrl}</code>
              </Typography>
            )}
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1 }}>
              Sent {formatDate(detailModal.createdAt)}{detailModal.sendEmail ? ' · Also via email' : ''}
            </Typography>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>Close</Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}

// ============================================================
// Compose modal
// ============================================================

function ComposeAnnouncementModal({
  onClose, onSent,
}: { onClose: () => void; onSent: () => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [target, setTarget] = useState<TargetAudience>('all');
  const [actionUrl, setActionUrl] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);

  // AI
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Enter a topic');
      return;
    }
    setAiGenerating(true);
    try {
      const res = await adminFetch('/api/admin/announcements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic.trim(), type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setTitle(data.generated.title);
      setMessage(data.generated.message);
      toast.success('Generated! Review and edit.');
      setAiOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(), message: message.trim(), type, target,
          actionUrl: actionUrl.trim() || undefined, sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      toast.success(`Sent to ${data.recipientCount?.toLocaleString() || 0} user${data.recipientCount !== 1 ? 's' : ''}`);
      onSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 600 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
        <ModalClose />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFF0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={18} color="#D97757" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level="title-lg" fontWeight={700}>New announcement</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Send an in-app announcement (and optionally email) to your users.
            </Typography>
          </Box>
          <Button
            size="sm" variant="soft" color="warning"
            startDecorator={<Sparkles size={14} />}
            onClick={() => setAiOpen(o => !o)}
            sx={{ borderRadius: '10px', flexShrink: 0 }}
          >
            {aiOpen ? 'Hide AI' : 'Use AI'}
          </Button>
        </Stack>
        <Divider sx={{ my: 2 }} />

        {aiOpen && (
          <Box sx={{
            p: 1.5, mb: 2, borderRadius: '10px',
            bgcolor: 'warning.softBg', border: '1px solid', borderColor: 'warning.outlinedBorder',
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Input
                size="sm" placeholder="Describe the topic (e.g. 'new invoice feature')"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                startDecorator={<Sparkles size={14} />}
                sx={{ flex: 1, borderRadius: '8px' }}
              />
              <Button
                size="sm" color="warning"
                startDecorator={aiGenerating ? <CircularProgress size="sm" /> : <Sparkles size={14} />}
                onClick={handleAiGenerate}
                loading={aiGenerating}
                disabled={!aiTopic.trim()}
                sx={{ borderRadius: '10px' }}
              >
                Generate
              </Button>
            </Stack>
          </Box>
        )}

        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>Title</FormLabel>
            <Input
              size="sm" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New feature: Recurring invoices"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
          <FormControl required>
            <FormLabel>Message</FormLabel>
            <Textarea
              minRows={4} maxRows={8}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your announcement message…"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Type</FormLabel>
              <Select
                size="sm" value={type}
                onChange={(_, v) => v && setType(v as AnnouncementType)}
                sx={{ borderRadius: '8px' }}
              >
                {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => (
                  <Option key={t} value={t}>{TYPE_CONFIG[t].label}</Option>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Target</FormLabel>
              <Select
                size="sm" value={target}
                onChange={(_, v) => v && setTarget(v as TargetAudience)}
                startDecorator={<Users size={14} />}
                sx={{ borderRadius: '8px' }}
              >
                {(Object.keys(TARGET_LABELS) as TargetAudience[]).map(t => (
                  <Option key={t} value={t}>{TARGET_LABELS[t]}</Option>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <FormControl>
            <FormLabel>Action URL (optional)</FormLabel>
            <Input
              size="sm" value={actionUrl}
              onChange={e => setActionUrl(e.target.value)}
              placeholder="/settings/billing or https://…"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
          <Checkbox
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Mail size={14} />
                <Typography level="body-sm">Also send via email</Typography>
              </Stack>
            }
            size="sm"
          />
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            startDecorator={<Send size={14} />}
            loading={sending}
            onClick={handleSend}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
          >
            Send announcement
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
