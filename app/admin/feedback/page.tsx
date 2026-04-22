'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton, Switch,
  Tab, TabList, TabPanel, Tabs, Modal, ModalDialog, ModalClose,
  Sheet, Table, IconButton, Tooltip, Select, Option, Input, Divider,
  FormControl, FormLabel, Textarea,
} from '@mui/joy';
import {
  MessageSquare, Star, CheckCircle, Inbox, ThumbsDown, ThumbsUp,
  Search, Filter, RefreshCw, Eye, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

type ChipColor = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const TYPE_COLORS: Record<string, ChipColor> = {
  suggestion: 'primary', praise: 'success', complaint: 'danger', bug_report: 'warning',
};
const STATUS_COLORS: Record<string, ChipColor> = {
  new: 'warning', reviewed: 'primary', acknowledged: 'success',
};

interface UserFeedback {
  id: string;
  subject?: string;
  description?: string;
  type?: string;
  rating?: number;
  status?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  adminResponse?: string;
  createdAt?: any;
}

interface ChatFeedback {
  id: string;
  rating?: 'like' | 'dislike';
  userMessage?: string;
  aiResponse?: string;
  complaint?: string;
  userId?: string;
  createdAt?: any;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminFeedbackPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [chatList, setChatList] = useState<ChatFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [promptEnabled, setPromptEnabled] = useState(true);
  const [togglingPrompt, setTogglingPrompt] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setChatLoading(true);
    adminFetch('/api/admin/feedback')
      .then(r => r.json())
      .then(d => setFeedbackList(d.feedback || []))
      .catch(() => toast.error('Failed to load feedback'))
      .finally(() => setLoading(false));

    adminFetch('/api/admin/chat-feedback')
      .then(r => r.json())
      .then(d => setChatList(d.feedback || []))
      .catch(() => {})
      .finally(() => setChatLoading(false));

    adminFetch('/api/admin/feedback/settings')
      .then(r => r.json())
      .then(d => setPromptEnabled(d.settings?.enabled !== false))
      .catch(() => {});
  };

  useEffect(() => { loadAll(); }, []);

  const toggleFeedbackPrompt = async () => {
    setTogglingPrompt(true);
    try {
      const res = await adminFetch('/api/admin/feedback/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !promptEnabled }),
      });
      if (res.ok) {
        setPromptEnabled(prev => !prev);
        toast.success(promptEnabled ? 'Feedback prompt disabled' : 'Feedback prompt enabled');
      }
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setTogglingPrompt(false);
    }
  };

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
              <MessageSquare size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Feedback</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Review user feedback and AI chat ratings.
              </Typography>
            </Box>
          </Stack>
          <Button
            size="sm" variant="outlined" color="neutral"
            startDecorator={<RefreshCw size={14} />}
            onClick={loadAll} loading={loading || chatLoading}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Settings card */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box sx={{ minWidth: 0 }}>
                <Typography level="body-sm" fontWeight={700}>In-App Feedback Prompt</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Periodically ask users to rate their experience.
                </Typography>
              </Box>
              <Switch
                checked={promptEnabled}
                onChange={toggleFeedbackPrompt}
                disabled={togglingPrompt}
                color="primary"
              />
            </Stack>
          </CardContent>
        </Card>

        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v as number)}>
          <TabList sx={{ '--List-gap': '4px' }}>
            <Tab value={0} sx={{ borderRadius: '8px' }}>
              User Feedback
              <Chip size="sm" variant="soft" color="neutral" sx={{ ml: 1, fontSize: '0.65rem', '--Chip-minHeight': '18px' }}>
                {feedbackList.length}
              </Chip>
            </Tab>
            <Tab value={1} sx={{ borderRadius: '8px' }}>
              AI Chat Feedback
              <Chip size="sm" variant="soft" color="neutral" sx={{ ml: 1, fontSize: '0.65rem', '--Chip-minHeight': '18px' }}>
                {chatList.length}
              </Chip>
            </Tab>
          </TabList>

          <TabPanel value={0} sx={{ px: 0, pt: 2 }}>
            <UserFeedbackTable
              items={feedbackList} loading={loading}
              onUpdate={(id, patch) => {
                setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
              }}
            />
          </TabPanel>

          <TabPanel value={1} sx={{ px: 0, pt: 2 }}>
            <ChatFeedbackTable items={chatList} loading={chatLoading} />
          </TabPanel>
        </Tabs>
      </Stack>
    </Box>
  );
}

// ============================================================
// User Feedback Table
// ============================================================

function UserFeedbackTable({
  items, loading, onUpdate,
}: {
  items: UserFeedback[]; loading: boolean;
  onUpdate: (id: string, patch: Partial<UserFeedback>) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<UserFeedback | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, pageSize]);

  const handleUpdate = async (id: string, patch: { status?: string; adminResponse?: string }) => {
    setUpdating(id);
    try {
      const res = await adminFetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: id, ...patch }),
      });
      if (!res.ok) throw new Error();
      toast.success('Feedback updated');
      onUpdate(id, patch);
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    return items.filter(f => {
      if (statusFilter && f.status !== statusFilter) return false;
      if (typeFilter && f.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(f.subject || '').toLowerCase().includes(q) &&
          !(f.description || '').toLowerCase().includes(q) &&
          !(f.userEmail || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [items, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  return (
    <Stack spacing={2}>
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
              placeholder="Search subject, description, user…"
              startDecorator={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
            />
            <Select
              size="sm" placeholder="All Types" value={typeFilter || ''}
              onChange={(_, v) => setTypeFilter(v || '')}
              sx={{ minWidth: 140, borderRadius: '8px' }}
            >
              <Option value="">All Types</Option>
              <Option value="suggestion">Suggestion</Option>
              <Option value="praise">Praise</Option>
              <Option value="complaint">Complaint</Option>
              <Option value="bug_report">Bug report</Option>
            </Select>
            <Select
              size="sm" placeholder="All Statuses" value={statusFilter || ''}
              onChange={(_, v) => setStatusFilter(v || '')}
              sx={{ minWidth: 140, borderRadius: '8px' }}
            >
              <Option value="">All Statuses</Option>
              <Option value="new">New</Option>
              <Option value="reviewed">Reviewed</Option>
              <Option value="acknowledged">Acknowledged</Option>
            </Select>
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
                <th>Subject</th>
                <th style={{ width: '8rem' }}>Type</th>
                <th style={{ width: '6rem' }}>Rating</th>
                <th style={{ width: '14rem' }}>User</th>
                <th style={{ width: '8rem' }}>Status</th>
                <th style={{ width: '7rem' }}>Date</th>
                <th style={{ width: '7rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton variant="text" width="80%" /></td>
                    <td><Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} /></td>
                    <td><Skeleton variant="text" width={50} /></td>
                    <td><Skeleton variant="text" width="70%" /></td>
                    <td><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 10 }} /></td>
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
                        {search || statusFilter || typeFilter ? 'No feedback matches your filters.' : 'No feedback yet.'}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : (
                pageRows.map(f => (
                  <tr key={f.id}>
                    <td>
                      <Typography
                        level="body-sm" fontWeight={600}
                        onClick={() => { setDetailModal(f); setResponse(f.adminResponse || ''); }}
                        sx={{
                          cursor: 'pointer',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          '&:hover': { color: 'primary.600' },
                        }}
                      >
                        {f.subject || '(no subject)'}
                      </Typography>
                    </td>
                    <td>
                      {f.type ? (
                        <Chip size="sm" variant="soft" color={TYPE_COLORS[f.type] || 'neutral'} sx={{ fontSize: '0.68rem' }}>
                          {f.type.replace(/_/g, ' ')}
                        </Chip>
                      ) : '—'}
                    </td>
                    <td>
                      {f.rating ? (
                        <Stack direction="row" spacing={0.25}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10}
                              fill={i < f.rating! ? 'var(--joy-palette-warning-400)' : 'none'}
                              color={i < f.rating! ? 'var(--joy-palette-warning-400)' : 'var(--joy-palette-neutral-300)'}
                            />
                          ))}
                        </Stack>
                      ) : '—'}
                    </td>
                    <td>
                      <Typography level="body-xs" fontWeight={500} noWrap>{f.userName || '—'}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>{f.userEmail || ''}</Typography>
                    </td>
                    <td>
                      <Chip
                        size="sm" variant="soft"
                        color={STATUS_COLORS[f.status || ''] || 'neutral'}
                        sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                      >
                        {f.status || 'new'}
                      </Chip>
                    </td>
                    <td>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {formatDate(f.createdAt)}
                      </Typography>
                    </td>
                    <td>
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip title="View & respond">
                          <IconButton
                            size="sm" variant="plain" color="neutral"
                            onClick={() => { setDetailModal(f); setResponse(f.adminResponse || ''); }}
                          >
                            <Eye size={14} />
                          </IconButton>
                        </Tooltip>
                        {f.status === 'new' && (
                          <Tooltip title="Mark acknowledged">
                            <IconButton
                              size="sm" variant="plain" color="success"
                              onClick={() => handleUpdate(f.id, { status: 'acknowledged' })}
                              loading={updating === f.id}
                            >
                              <CheckCircle size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
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

      {/* Detail modal */}
      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 560 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Typography level="title-lg" fontWeight={700}>{detailModal.subject || '(no subject)'}</Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap' }} useFlexGap>
              {detailModal.type && (
                <Chip size="sm" variant="soft" color={TYPE_COLORS[detailModal.type] || 'neutral'}>
                  {detailModal.type.replace(/_/g, ' ')}
                </Chip>
              )}
              <Chip size="sm" variant="soft" color={STATUS_COLORS[detailModal.status || ''] || 'neutral'}>
                {detailModal.status || 'new'}
              </Chip>
              {detailModal.rating && (
                <Stack direction="row" spacing={0.25}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12}
                      fill={i < detailModal.rating! ? 'var(--joy-palette-warning-400)' : 'none'}
                      color={i < detailModal.rating! ? 'var(--joy-palette-warning-400)' : 'var(--joy-palette-neutral-300)'}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  From
                </Typography>
                <Typography level="body-sm">{detailModal.userName || '—'}</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  {detailModal.userEmail} · {formatDate(detailModal.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  Message
                </Typography>
                <Box sx={{
                  p: 1.5, borderRadius: '8px', bgcolor: 'background.level1',
                  border: '1px solid', borderColor: 'divider',
                }}>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>
                    {detailModal.description || '(no description)'}
                  </Typography>
                </Box>
              </Box>
              <FormControl>
                <FormLabel>Admin response (sent to user)</FormLabel>
                <Textarea
                  value={response} onChange={e => setResponse(e.target.value)}
                  placeholder="Optional response to the user…"
                  minRows={3} maxRows={8}
                  sx={{ borderRadius: '8px' }}
                />
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>Close</Button>
              {response && response !== (detailModal.adminResponse || '') && (
                <Button
                  startDecorator={<Save size={14} />}
                  onClick={() => {
                    handleUpdate(detailModal.id, { adminResponse: response, status: 'acknowledged' });
                    setDetailModal(null);
                  }}
                  loading={updating === detailModal.id}
                  sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
                >
                  Send response
                </Button>
              )}
              {detailModal.status === 'new' && !response && (
                <Button
                  color="success"
                  startDecorator={<CheckCircle size={14} />}
                  onClick={() => {
                    handleUpdate(detailModal.id, { status: 'acknowledged' });
                    setDetailModal(null);
                  }}
                  loading={updating === detailModal.id}
                  sx={{ borderRadius: '10px' }}
                >
                  Mark acknowledged
                </Button>
              )}
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Stack>
  );
}

// ============================================================
// Chat Feedback Table
// ============================================================

function ChatFeedbackTable({ items, loading }: { items: ChatFeedback[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailModal, setDetailModal] = useState<ChatFeedback | null>(null);

  useEffect(() => { setPage(1); }, [search, ratingFilter, pageSize]);

  const filtered = useMemo(() => {
    return items.filter(f => {
      if (ratingFilter && f.rating !== ratingFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(f.userMessage || '').toLowerCase().includes(q) &&
          !(f.aiResponse || '').toLowerCase().includes(q) &&
          !(f.complaint || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [items, search, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  return (
    <Stack spacing={2}>
      <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
              <Filter size={14} />
              <Typography level="body-xs" fontWeight={600}>Filters</Typography>
            </Stack>
            <Input
              size="sm"
              placeholder="Search messages…"
              startDecorator={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
            />
            <Select
              size="sm" placeholder="All Ratings" value={ratingFilter || ''}
              onChange={(_, v) => setRatingFilter(v || '')}
              sx={{ minWidth: 140, borderRadius: '8px' }}
            >
              <Option value="">All Ratings</Option>
              <Option value="like">Thumbs up</Option>
              <Option value="dislike">Thumbs down</Option>
            </Select>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
        <Sheet sx={{ overflow: 'auto' }}>
          <Table hoverRow stickyHeader sx={{
            '& thead th': {
              py: 1.25, fontSize: '0.7rem', fontWeight: 700,
              color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
              bgcolor: 'background.surface',
            },
            '& tbody td': { py: 1.5, verticalAlign: 'top' },
            minWidth: 800,
          }}>
            <thead>
              <tr>
                <th style={{ width: '5rem' }}>Rating</th>
                <th>User question</th>
                <th>AI response</th>
                <th style={{ width: '7rem' }}>Date</th>
                <th style={{ width: '5rem', textAlign: 'right' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton variant="circular" width={24} height={24} /></td>
                    <td><Skeleton variant="text" width="85%" /></td>
                    <td><Skeleton variant="text" width="85%" /></td>
                    <td><Skeleton variant="text" width={60} /></td>
                    <td><Skeleton variant="text" width={30} sx={{ ml: 'auto' }} /></td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                      <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                      <Typography level="body-sm">
                        {search || ratingFilter ? 'No chat feedback matches your filters.' : 'No chat feedback yet.'}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : (
                pageRows.map(f => (
                  <tr key={f.id}>
                    <td>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: f.rating === 'like' ? 'success.softBg' : 'danger.softBg',
                      }}>
                        {f.rating === 'like' ? (
                          <ThumbsUp size={14} color="var(--joy-palette-success-600)" />
                        ) : (
                          <ThumbsDown size={14} color="var(--joy-palette-danger-600)" />
                        )}
                      </Box>
                    </td>
                    <td>
                      <Typography level="body-sm" sx={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {f.userMessage || '—'}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-sm" sx={{
                        color: 'text.secondary',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {f.aiResponse || '—'}
                      </Typography>
                      {f.complaint && (
                        <Typography level="body-xs" sx={{ color: 'danger.500', fontStyle: 'italic', mt: 0.5 }}>
                          "{f.complaint}"
                        </Typography>
                      )}
                    </td>
                    <td>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {formatDate(f.createdAt)}
                      </Typography>
                    </td>
                    <td>
                      <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="View full exchange">
                          <IconButton size="sm" variant="plain" color="neutral" onClick={() => setDetailModal(f)}>
                            <Eye size={14} />
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

      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 560 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px',
                bgcolor: detailModal.rating === 'like' ? 'success.softBg' : 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {detailModal.rating === 'like' ? (
                  <ThumbsUp size={18} color="var(--joy-palette-success-600)" />
                ) : (
                  <ThumbsDown size={18} color="var(--joy-palette-danger-600)" />
                )}
              </Box>
              <Box>
                <Typography level="title-lg" fontWeight={700}>
                  Chat feedback {detailModal.rating === 'like' ? '👍' : '👎'}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  {formatDate(detailModal.createdAt)}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  User question
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>{detailModal.userMessage || '—'}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  AI response
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'primary.softBg', border: '1px solid', borderColor: 'primary.outlinedBorder' }}>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>{detailModal.aiResponse || '—'}</Typography>
                </Box>
              </Box>
              {detailModal.complaint && (
                <Box>
                  <Typography level="body-xs" fontWeight={700} sx={{ color: 'danger.500', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Complaint
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.outlinedBorder' }}>
                    <Typography level="body-sm" sx={{ color: 'danger.700', fontStyle: 'italic' }}>"{detailModal.complaint}"</Typography>
                  </Box>
                </Box>
              )}
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>User ID: {detailModal.userId || '—'}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>Close</Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Stack>
  );
}
