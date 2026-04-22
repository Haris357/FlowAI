'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton,
  Modal, ModalDialog, ModalClose, Sheet, Table, IconButton, Tooltip,
  Select, Option, Input, Divider, Textarea, FormControl, FormLabel,
} from '@mui/joy';
import {
  HelpCircle, CheckCircle, Inbox, Search, Filter, RefreshCw, Eye,
  Send, XCircle, Bot, Shield, User as UserIcon, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

type ChipColor = 'warning' | 'primary' | 'success' | 'neutral' | 'danger';

const STATUS_COLORS: Record<string, ChipColor> = {
  open: 'warning', in_progress: 'primary', waiting_user: 'warning',
  resolved: 'success', closed: 'neutral', rejected: 'danger',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In progress', waiting_user: 'Waiting on user',
  resolved: 'Resolved', closed: 'Closed', rejected: 'Rejected',
};
const PRIORITY_COLORS: Record<string, ChipColor> = {
  low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger',
};

interface SupportTicket {
  id: string;
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  adminNotes?: string;
  rejectionReason?: string;
  fromAiChat?: boolean;
  lastUserMessageAt?: any;
  lastAdminMessageAt?: any;
  createdAt?: any;
}

interface TicketMessage {
  id: string;
  authorType: 'user' | 'admin' | 'system' | 'ai';
  authorId: string;
  authorName: string;
  body: string;
  createdAt: any;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatFull(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [detailModal, setDetailModal] = useState<SupportTicket | null>(null);
  const [rejectModal, setRejectModal] = useState<SupportTicket | null>(null);

  const load = () => {
    setLoading(true);
    adminFetch('/api/admin/support')
      .then(res => res.json())
      .then(d => setTickets(d.tickets || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, pageSize]);

  const handleUpdate = async (ticketId: string, patch: Record<string, any>) => {
    setUpdating(ticketId);
    try {
      const res = await adminFetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, ...patch }),
      });
      if (!res.ok) throw new Error();
      toast.success('Ticket updated');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...patch } : t));
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(t.subject || '').toLowerCase().includes(q) &&
          !(t.description || '').toLowerCase().includes(q) &&
          !(t.userEmail || '').toLowerCase().includes(q) &&
          !(t.userName || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const waitingUserCount = tickets.filter(t => t.status === 'waiting_user').length;

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <HelpCircle size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Support Tickets</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {openCount} open · {inProgressCount} in progress · {waitingUserCount} waiting · {tickets.length} total
              </Typography>
            </Box>
          </Stack>
          <Button
            size="sm" variant="outlined" color="neutral"
            startDecorator={<RefreshCw size={14} />}
            onClick={load} loading={loading}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
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
                placeholder="Search subject, description, user…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm"
                placeholder="All Statuses"
                value={statusFilter || ''}
                onChange={(_, v) => setStatusFilter(v || '')}
                sx={{ minWidth: 160, borderRadius: '8px' }}
              >
                <Option value="">All Statuses</Option>
                <Option value="open">Open</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="waiting_user">Waiting on User</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="closed">Closed</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
              <Select
                size="sm"
                placeholder="All Priorities"
                value={priorityFilter || ''}
                onChange={(_, v) => setPriorityFilter(v || '')}
                sx={{ minWidth: 140, borderRadius: '8px' }}
              >
                <Option value="">All Priorities</Option>
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
              {(search || statusFilter || priorityFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}
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
            <Table
              hoverRow stickyHeader
              sx={{
                '& thead th': {
                  py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                  color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                  bgcolor: 'background.surface',
                },
                '& tbody td': { py: 1.5, verticalAlign: 'middle' },
                minWidth: 950,
              }}
            >
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style={{ width: '14rem' }}>User</th>
                  <th style={{ width: '7rem' }}>Category</th>
                  <th style={{ width: '7rem' }}>Priority</th>
                  <th style={{ width: '9rem' }}>Status</th>
                  <th style={{ width: '7rem' }}>Created</th>
                  <th style={{ width: '8rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="text" width="70%" /></td>
                      <td><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={80} height={18} sx={{ borderRadius: 10 }} /></td>
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
                          {search || statusFilter || priorityFilter ? 'No tickets match your filters.' : 'No tickets yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(t => (
                    <tr key={t.id}>
                      <td>
                        <Box
                          onClick={() => setDetailModal(t)}
                          sx={{ cursor: 'pointer', minWidth: 0 }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography
                              level="body-sm" fontWeight={600}
                              sx={{
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                                '&:hover': { color: 'primary.600' },
                              }}
                            >
                              {t.subject || '(no subject)'}
                            </Typography>
                            {t.fromAiChat && (
                              <Tooltip title="Escalated from AI chat">
                                <Chip size="sm" variant="soft" color="warning"
                                  startDecorator={<Bot size={9} />}
                                  sx={{ fontSize: '0.58rem', fontWeight: 700, '--Chip-minHeight': '16px', px: 0.625 }}
                                >
                                  AI
                                </Chip>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      </td>
                      <td>
                        <Typography level="body-xs" fontWeight={500} noWrap>{t.userName || '—'}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>{t.userEmail || ''}</Typography>
                      </td>
                      <td>
                        {t.category ? (
                          <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '0.68rem' }}>
                            {t.category.replace(/_/g, ' ')}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td>
                        {t.priority ? (
                          <Chip
                            size="sm" variant="soft"
                            color={PRIORITY_COLORS[t.priority] || 'neutral'}
                            sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                          >
                            {t.priority}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td>
                        <Chip
                          size="sm" variant="soft"
                          color={STATUS_COLORS[t.status || ''] || 'neutral'}
                          sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                        >
                          {STATUS_LABELS[t.status || ''] || t.status || 'open'}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {formatDate(t.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title="Open conversation">
                            <IconButton size="sm" variant="plain" color="neutral" onClick={() => setDetailModal(t)}>
                              <Eye size={14} />
                            </IconButton>
                          </Tooltip>
                          {t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'rejected' && (
                            <Tooltip title="Mark resolved">
                              <IconButton
                                size="sm" variant="plain" color="success"
                                onClick={() => handleUpdate(t.id, { status: 'resolved' })}
                                loading={updating === t.id}
                              >
                                <CheckCircle size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {t.status !== 'rejected' && t.status !== 'resolved' && t.status !== 'closed' && (
                            <Tooltip title="Reject">
                              <IconButton
                                size="sm" variant="plain" color="danger"
                                onClick={() => setRejectModal(t)}
                              >
                                <XCircle size={14} />
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
      </Stack>

      {/* Conversation modal */}
      {detailModal && (
        <ConversationModal
          ticket={detailModal}
          updating={updating}
          onClose={() => setDetailModal(null)}
          onUpdate={(patch) => handleUpdate(detailModal.id, patch)}
          onReject={() => { setRejectModal(detailModal); setDetailModal(null); }}
          onRefreshList={load}
        />
      )}

      {/* Reject modal */}
      {rejectModal && (
        <RejectModal
          ticket={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={async (reason) => {
            await handleUpdate(rejectModal.id, { status: 'rejected', rejectionReason: reason });
            setRejectModal(null);
          }}
        />
      )}
    </Box>
  );
}

// ============================================================================
// Conversation modal — admin view of full thread + reply
// ============================================================================

function ConversationModal({
  ticket, updating, onClose, onUpdate, onReject, onRefreshList,
}: {
  ticket: SupportTicket;
  updating: string | null;
  onClose: () => void;
  onUpdate: (patch: Record<string, any>) => void;
  onReject: () => void;
  onRefreshList: () => void;
}) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    setLoadingMsgs(true);
    try {
      const res = await adminFetch(`/api/admin/support/${ticket.id}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error('Failed to load conversation');
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => { loadMessages(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ticket.id]);
  useEffect(() => {
    if (!loadingMsgs) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loadingMsgs]);

  const handleSendReply = async () => {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/support/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to send reply');
        return;
      }
      setReply('');
      toast.success('Reply sent');
      await loadMessages();
      onRefreshList();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{
        maxWidth: { xs: '95vw', sm: 680 }, width: '100%', borderRadius: '16px',
        maxHeight: '92vh', overflow: 'hidden', p: 0, display: 'flex', flexDirection: 'column',
      }}>
        <ModalClose sx={{ zIndex: 2 }} />

        {/* Header */}
        <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography level="title-lg" fontWeight={700} sx={{ pr: 4 }}>
            {ticket.subject || '(no subject)'}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
            <Chip size="sm" variant="soft" color={STATUS_COLORS[ticket.status || ''] || 'neutral'}>
              {STATUS_LABELS[ticket.status || ''] || ticket.status}
            </Chip>
            {ticket.priority && (
              <Chip size="sm" variant="soft" color={PRIORITY_COLORS[ticket.priority] || 'neutral'}>
                {ticket.priority}
              </Chip>
            )}
            {ticket.category && (
              <Chip size="sm" variant="outlined" color="neutral">{ticket.category.replace(/_/g, ' ')}</Chip>
            )}
            {ticket.fromAiChat && (
              <Chip size="sm" variant="soft" color="warning" startDecorator={<Bot size={10} />}>
                From AI chat
              </Chip>
            )}
          </Stack>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1 }}>
            <strong>{ticket.userName}</strong> · {ticket.userEmail} · Ticket #{ticket.id.slice(0, 8)} · Opened {formatFull(ticket.createdAt)}
          </Typography>
        </Box>

        {/* Thread */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5, bgcolor: 'background.level1' }}>
          {loadingMsgs ? (
            <Stack spacing={2}>
              {[1, 2].map(i => (
                <Box key={i}>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 0.5, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          ) : messages.length === 0 ? (
            <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center', py: 3 }}>
              No messages.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {messages.map(m => <AdminMessageBubble key={m.id} message={m} />)}
              <div ref={bottomRef} />
            </Stack>
          )}
        </Box>

        {/* Composer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.surface' }}>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSendReply(); }
            }}
            placeholder="Reply to the user…"
            minRows={2} maxRows={6}
            sx={{ borderRadius: '10px', mb: 1.25 }}
            disabled={sending}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
            <Stack direction="row" spacing={0.75}>
              {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'rejected' && (
                <Button
                  size="sm" variant="outlined" color="primary"
                  startDecorator={<RefreshCw size={13} />}
                  onClick={() => onUpdate({ status: 'in_progress' })}
                  loading={updating === ticket.id}
                  sx={{ borderRadius: '10px' }}
                >
                  Start working
                </Button>
              )}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'rejected' && (
                <Button
                  size="sm" variant="outlined" color="success"
                  startDecorator={<CheckCircle size={13} />}
                  onClick={() => onUpdate({ status: 'resolved' })}
                  loading={updating === ticket.id}
                  sx={{ borderRadius: '10px' }}
                >
                  Resolve
                </Button>
              )}
              {ticket.status !== 'rejected' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Button
                  size="sm" variant="outlined" color="danger"
                  startDecorator={<XCircle size={13} />}
                  onClick={onReject}
                  sx={{ borderRadius: '10px' }}
                >
                  Reject
                </Button>
              )}
            </Stack>
            <Button
              onClick={handleSendReply}
              loading={sending}
              disabled={!reply.trim()}
              startDecorator={<Send size={14} />}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              Send reply
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}

function AdminMessageBubble({ message }: { message: TicketMessage }) {
  const isUser = message.authorType === 'user';
  const isAdmin = message.authorType === 'admin';
  const isAi = message.authorType === 'ai';
  const isSystem = message.authorType === 'system';

  if (isSystem) {
    return (
      <Box sx={{ textAlign: 'center', py: 0.5 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>
          {message.body}
        </Typography>
      </Box>
    );
  }

  const avatarBg = isAdmin ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : isAi ? 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)'
    : undefined;
  const AvatarIcon = isAdmin ? Shield : isAi ? Bot : UserIcon;

  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{
      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
    }}>
      {!isAdmin && (
        <Box sx={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: avatarBg, bgcolor: !avatarBg ? 'neutral.softBg' : undefined,
          color: isAi ? 'white' : 'neutral.700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AvatarIcon size={13} />
        </Box>
      )}
      <Box sx={{ maxWidth: '78%', minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{
          mb: 0.5, justifyContent: isAdmin ? 'flex-end' : 'flex-start',
        }}>
          <Typography level="body-xs" fontWeight={700}>
            {isUser ? message.authorName || 'User' : isAdmin ? (message.authorName || 'Support team') : 'Flowbooks AI'}
          </Typography>
          {isUser && (
            <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '0.6rem', '--Chip-minHeight': '16px' }}>
              User
            </Chip>
          )}
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {formatFull(message.createdAt)}
          </Typography>
        </Stack>
        <Box sx={{
          px: 2, py: 1.5,
          borderRadius: isAdmin ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          bgcolor: isAdmin ? 'success.500' : 'background.surface',
          color: isAdmin ? 'white' : 'text.primary',
          border: isAdmin ? 'none' : '1px solid',
          borderColor: 'divider',
        }}>
          <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'inherit' }}>
            {message.body}
          </Typography>
        </Box>
      </Box>
      {isAdmin && (
        <Box sx={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: avatarBg,
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={13} />
        </Box>
      )}
    </Stack>
  );
}

// ============================================================================
// Reject modal
// ============================================================================

function RejectModal({
  ticket, onClose, onConfirm,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason — it will be shown to the user.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={submitting ? undefined : onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 480 }, width: '100%', borderRadius: '16px' }}>
        <ModalClose disabled={submitting} />
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            bgcolor: 'danger.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={18} style={{ color: 'var(--joy-palette-danger-500)' }} />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>Reject this ticket?</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
              The user will be notified with the reason below. They can still reply to reopen the conversation.
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <FormControl required>
          <FormLabel>Rejection reason (shown to user)</FormLabel>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. This issue is outside the scope of support. Please contact your admin…"
            minRows={3} maxRows={6}
            sx={{ borderRadius: '10px' }}
          />
        </FormControl>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            color="danger" loading={submitting}
            disabled={!reason.trim()}
            startDecorator={<XCircle size={14} />}
            onClick={handleSubmit}
            sx={{ borderRadius: '10px' }}
          >
            Reject ticket
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
