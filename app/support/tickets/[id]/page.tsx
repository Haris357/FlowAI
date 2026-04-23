'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Textarea,
  Divider, Skeleton, Sheet, IconButton, CircularProgress,
} from '@mui/joy';
import {
  ArrowLeft, Send, CheckCircle, Clock, XCircle, RefreshCw, AlertCircle,
  Bot, User as UserIcon, Shield, MessageSquare, HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  doc, collection, onSnapshot, orderBy, query, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { SupportTicket, TicketMessage, TicketStatus } from '@/types/support';

const STATUS_META: Record<TicketStatus, { label: string; color: 'warning' | 'primary' | 'success' | 'neutral' | 'danger'; icon: any }> = {
  open:          { label: 'Open',            color: 'warning', icon: Clock },
  in_progress:   { label: 'In progress',     color: 'primary', icon: RefreshCw },
  waiting_user:  { label: 'Waiting on you',  color: 'warning', icon: AlertCircle },
  resolved:      { label: 'Resolved',        color: 'success', icon: CheckCircle },
  closed:        { label: 'Closed',          color: 'neutral', icon: CheckCircle },
  rejected:      { label: 'Rejected',        color: 'danger',  icon: XCircle },
};

const PRIORITY_COLORS: Record<string, 'neutral' | 'primary' | 'warning' | 'danger'> = {
  low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger',
};

function formatFull(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to ticket + messages
  useEffect(() => {
    if (!ticketId || !user?.uid) return;

    const ticketRef = doc(db, 'supportTickets', ticketId);
    const unsubTicket = onSnapshot(
      ticketRef,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        if (data.userId !== user.uid) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setTicket({ id: snap.id, ...data } as SupportTicket);
        setLoading(false);
      },
      (err) => {
        console.error('[ticket detail] snapshot error:', err);
        setNotFound(true);
        setLoading(false);
      }
    );

    const messagesQuery = query(
      collection(db, 'supportTickets', ticketId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsubMsgs = onSnapshot(
      messagesQuery,
      (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as TicketMessage)),
      (err) => console.error('[ticket detail] messages error:', err),
    );

    return () => { unsubTicket(); unsubMsgs(); };
  }, [ticketId, user?.uid]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleReply = async () => {
    const trimmed = reply.trim();
    if (!trimmed || !user || !ticket) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to send reply');
        return;
      }
      setReply('');
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <TicketLoading />;
  }

  if (notFound || !ticket) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
        <TopBar />
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
          <HelpCircle size={40} style={{ color: 'var(--joy-palette-neutral-400)', marginBottom: 12 }} />
          <Typography level="h4" fontWeight={700}>Ticket not found</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1 }}>
            This ticket doesn't exist or isn't yours.
          </Typography>
          <Button
            component={Link} href="/support"
            startDecorator={<ArrowLeft size={14} />}
            sx={{ mt: 3, bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
          >
            Back to Support
          </Button>
        </Box>
      </Box>
    );
  }

  const cfg = STATUS_META[ticket.status] || STATUS_META.open;
  const StatusIcon = cfg.icon;
  const canReply = !['closed'].includes(ticket.status);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <TopBar />

      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        {/* Back + meta */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button
            component={Link} href="/support"
            size="sm" variant="plain" color="neutral"
            startDecorator={<ArrowLeft size={14} />}
            sx={{ borderRadius: '10px' }}
          >
            Back to tickets
          </Button>
        </Stack>

        {/* Ticket header */}
        <Card variant="outlined" sx={{ borderRadius: '16px', mb: 2.5 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="h4" fontWeight={700} sx={{ mb: 1 }}>
                  {ticket.subject}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Chip size="sm" variant="soft" color={cfg.color} startDecorator={<StatusIcon size={11} />} sx={{ fontWeight: 600 }}>
                    {cfg.label}
                  </Chip>
                  <Chip size="sm" variant="outlined" color={PRIORITY_COLORS[ticket.priority] || 'neutral'}>
                    {ticket.priority} priority
                  </Chip>
                  <Chip size="sm" variant="outlined" color="neutral">
                    {ticket.category.replace(/_/g, ' ')}
                  </Chip>
                  {ticket.fromAiChat && (
                    <Chip size="sm" variant="soft" color="warning" startDecorator={<Bot size={10} />}>
                      From AI chat
                    </Chip>
                  )}
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1.25 }}>
                  Opened {formatFull(ticket.createdAt)} · Ticket #{ticket.id.slice(0, 8)}
                </Typography>
              </Box>
            </Stack>

            {/* Rejection notice */}
            {ticket.status === 'rejected' && ticket.rejectionReason && (
              <Box sx={{
                mt: 2, p: 2, borderRadius: '10px',
                bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.outlinedBorder',
              }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <XCircle size={16} style={{ color: 'var(--joy-palette-danger-600)', flexShrink: 0, marginTop: 1 }} />
                  <Box>
                    <Typography level="body-sm" fontWeight={700} sx={{ color: 'danger.700', mb: 0.25 }}>
                      This ticket was rejected
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'danger.600', whiteSpace: 'pre-wrap' }}>
                      {ticket.rejectionReason}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1 }}>
                      You can reply below to reopen the conversation if you need more help.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {ticket.status === 'resolved' && (
              <Box sx={{
                mt: 2, p: 2, borderRadius: '10px',
                bgcolor: 'success.softBg', border: '1px solid', borderColor: 'success.outlinedBorder',
              }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircle size={16} style={{ color: 'var(--joy-palette-success-600)' }} />
                  <Typography level="body-sm" sx={{ color: 'success.700' }}>
                    This ticket has been resolved. Reply below if you need to reopen it.
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Conversation thread */}
        <Card variant="outlined" sx={{ borderRadius: '16px', p: 0, overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MessageSquare size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              <Typography level="title-sm" fontWeight={700}>
                Conversation
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                ({messages.length} {messages.length === 1 ? 'message' : 'messages'})
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.level1' }}>
            <Stack spacing={2}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.tertiary' }}>
                  <Typography level="body-sm">No messages yet.</Typography>
                </Box>
              ) : (
                messages.map(m => <MessageBubble key={m.id} message={m} />)
              )}
              <div ref={bottomRef} />
            </Stack>
          </Box>

          {/* Reply composer */}
          {canReply ? (
            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.surface' }}>
              <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                Reply
              </Typography>
              <Stack direction="column" spacing={1.25}>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                  placeholder="Type your reply…"
                  minRows={3} maxRows={10}
                  sx={{ borderRadius: '10px' }}
                  disabled={sending}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Press Cmd/Ctrl + Enter to send
                  </Typography>
                  <Button
                    onClick={handleReply}
                    loading={sending}
                    disabled={!reply.trim()}
                    startDecorator={<Send size={14} />}
                    sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
                  >
                    Send reply
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1', textAlign: 'center' }}>
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                This ticket is closed and cannot be replied to. Please open a new ticket if you need further help.
              </Typography>
              <Button
                component={Link} href="/support"
                variant="soft" color="primary" size="sm"
                sx={{ mt: 1.5, borderRadius: '10px' }}
              >
                Back to Support
              </Button>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function TopBar() {
  const { user } = useAuth();
  return (
    <Sheet
      variant="outlined"
      sx={{
        position: 'sticky', top: 0, zIndex: 100,
        px: { xs: 2, md: 3 }, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        bgcolor: 'background.surface',
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      }}
    >
      <Box sx={{
        width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
        bgcolor: 'warning.softBg',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <HelpCircle size={17} color="#D97757" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography level="title-md" fontWeight={700}>Support Center</Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
          {user?.email}
        </Typography>
      </Box>
    </Sheet>
  );
}

function TicketLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <TopBar />
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Skeleton variant="text" width={140} sx={{ mb: 2 }} />
        <Card variant="outlined" sx={{ borderRadius: '16px', mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" sx={{ fontSize: '1.5rem', mb: 1.5 }} />
            <Stack direction="row" spacing={0.75}>
              <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 10 }} />
              <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 10 }} />
              <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 10 }} />
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: '16px' }}>
          <CardContent sx={{ p: 3 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="20%" />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 0.5, borderRadius: 1 }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isAdmin = message.authorType === 'admin';
  const isUser = message.authorType === 'user';
  const isAi = message.authorType === 'ai';
  const isSystem = message.authorType === 'system';

  if (isSystem) {
    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>
          {message.body}
        </Typography>
      </Box>
    );
  }

  const avatarStyle = isAdmin
    ? { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', icon: Shield }
    : isAi
    ? { bg: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)', icon: Bot }
    : { bg: 'neutral.softBg', icon: UserIcon };

  const AvatarIcon = avatarStyle.icon;

  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      {!isUser && (
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: typeof avatarStyle.bg === 'string' && avatarStyle.bg.startsWith('linear-gradient')
            ? avatarStyle.bg
            : undefined,
          bgcolor: typeof avatarStyle.bg === 'string' && !avatarStyle.bg.startsWith('linear-gradient')
            ? avatarStyle.bg
            : undefined,
          color: isAdmin || isAi ? 'white' : 'neutral.700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AvatarIcon size={14} />
        </Box>
      )}
      <Box sx={{ maxWidth: '78%', minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <Typography level="body-xs" fontWeight={700}>
            {isAdmin ? `${message.authorName || 'Support team'}` : isAi ? 'Flowbooks AI' : message.authorName || 'You'}
          </Typography>
          {isAdmin && (
            <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '0.6rem', '--Chip-minHeight': '16px' }}>
              Support
            </Chip>
          )}
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {formatFull(message.createdAt)}
          </Typography>
        </Stack>
        <Box sx={{
          px: 2, py: 1.5,
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          bgcolor: isUser ? '#D97757' : 'background.surface',
          color: isUser ? 'white' : 'text.primary',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
          boxShadow: isUser ? '0 2px 6px rgba(217,119,87,0.25)' : 'none',
        }}>
          <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'inherit' }}>
            {message.body}
          </Typography>
        </Box>
      </Box>
      {isUser && (
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          bgcolor: 'neutral.softBg', color: 'neutral.700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserIcon size={14} />
        </Box>
      )}
    </Stack>
  );
}
