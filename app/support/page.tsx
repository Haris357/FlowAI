'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Stack, Card, CardContent, Button, Chip, Skeleton,
  Input, Textarea, Select, Option, IconButton, Divider, Sheet, CircularProgress,
  Modal, ModalDialog, ModalClose, FormControl, FormLabel,
} from '@mui/joy';
import {
  HelpCircle, Bot, Send, Plus, User, Sparkles, ArrowRight, CheckCircle,
  Clock, AlertCircle, XCircle, MessageSquare, Inbox, Home, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  collection, query, where, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { SupportTicket, TicketStatus, TicketCategory, TicketPriority } from '@/types/support';

const STATUS_META: Record<TicketStatus, { label: string; color: 'warning' | 'primary' | 'success' | 'neutral' | 'danger'; icon: any }> = {
  open:          { label: 'Open',          color: 'warning', icon: Clock },
  in_progress:   { label: 'In progress',   color: 'primary', icon: RefreshCw },
  waiting_user:  { label: 'Waiting on you', color: 'warning', icon: AlertCircle },
  resolved:      { label: 'Resolved',      color: 'success', icon: CheckCircle },
  closed:        { label: 'Closed',        color: 'neutral', icon: CheckCircle },
  rejected:      { label: 'Rejected',      color: 'danger',  icon: XCircle },
};

function formatRelative(ts: any): string {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialTicketState, setInitialTicketState] = useState<{ subject?: string; description?: string; fromAiChat?: boolean; transcript?: { role: 'user' | 'ai'; content: string }[] } | null>(null);

  // Subscribe to the user's tickets in real time
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket));
        setLoadingTickets(false);
      },
      (err) => {
        console.error('[support] tickets snapshot error:', err);
        setLoadingTickets(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const openCount = useMemo(
    () => tickets.filter(t => ['open', 'in_progress', 'waiting_user'].includes(t.status)).length,
    [tickets]
  );

  const handleEscalateFromChat = (transcript: { role: 'user' | 'ai'; content: string }[]) => {
    // Use the last user question as the default subject
    const lastUserMsg = [...transcript].reverse().find(m => m.role === 'user')?.content || '';
    setInitialTicketState({
      subject: lastUserMsg.slice(0, 80),
      description: lastUserMsg,
      fromAiChat: true,
      transcript,
    });
    setCreateOpen(true);
  };

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: 'background.body',
    }}>
      {/* Top bar */}
      <Sheet
        variant="outlined"
        sx={{
          flexShrink: 0,
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
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Signed in as {user?.email}
          </Typography>
        </Box>
        <Button
          component="a"
          href="https://flowbooksai.com/companies"
          size="sm" variant="plain" color="neutral"
          startDecorator={<Home size={14} />}
          sx={{ borderRadius: '10px' }}
        >
          Back to app
        </Button>
      </Sheet>

      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 2, md: 3 },
      }}>
        {/* Hero */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2.5, flexShrink: 0 }}>
          <Box>
            <Typography level="h2" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              How can we help?
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary', maxWidth: 560 }}>
              Ask our AI assistant for instant help, or open a ticket to talk to a human on our team.
            </Typography>
          </Box>
          <Button
            size="lg"
            startDecorator={<Plus size={16} />}
            onClick={() => { setInitialTicketState(null); setCreateOpen(true); }}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '12px', fontWeight: 700 }}
          >
            New ticket
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          alignItems="stretch"
          sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {/* LEFT: AI chat widget */}
          <Box sx={{ flex: { md: 1.4 }, minWidth: 0, minHeight: 0, height: { xs: '60%', md: '100%' }, display: 'flex' }}>
            <AiChatWidget onEscalate={handleEscalateFromChat} />
          </Box>

          {/* RIGHT: tickets sidebar */}
          <Box sx={{
            flex: { md: 1 },
            minWidth: 0,
            minHeight: 0,
            height: { xs: '40%', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: '16px', p: 0, overflow: 'hidden',
                flex: 1, minHeight: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
                  px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
                }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <MessageSquare size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>Your tickets</Typography>
                    {openCount > 0 && (
                      <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '0.65rem', '--Chip-minHeight': '18px' }}>
                        {openCount} active
                      </Chip>
                    )}
                  </Stack>
                </Stack>

                {loadingTickets ? (
                  <Stack spacing={0} sx={{ p: 1.25 }}>
                    {[1, 2, 3].map(i => (
                      <Box key={i} sx={{ p: 1.5 }}>
                        <Skeleton variant="text" width="75%" />
                        <Skeleton variant="text" width="45%" sx={{ mt: 0.5 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : tickets.length === 0 ? (
                  <Stack spacing={1.25} alignItems="center" sx={{ py: 5, px: 3, textAlign: 'center' }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      bgcolor: 'neutral.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Inbox size={20} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                    </Box>
                    <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.secondary' }}>
                      No tickets yet
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      Ask the AI above or open a new ticket.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={0} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {tickets.map((t, i) => {
                      const cfg = STATUS_META[t.status] || STATUS_META.open;
                      const Icon = cfg.icon;
                      return (
                        <Box
                          key={t.id}
                          onClick={() => router.push(`/support/tickets/${t.id}`)}
                          sx={{
                            px: 2.5, py: 1.75,
                            cursor: 'pointer',
                            borderBottom: i < tickets.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: 'background.level1' },
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography level="body-sm" fontWeight={600} noWrap>
                                {t.subject}
                              </Typography>
                              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {formatRelative(t.updatedAt || t.createdAt)}
                                </Typography>
                                {t.fromAiChat && (
                                  <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '0.6rem', '--Chip-minHeight': '16px' }}>
                                    AI
                                  </Chip>
                                )}
                              </Stack>
                            </Box>
                            <Chip
                              size="sm" variant="soft" color={cfg.color}
                              startDecorator={<Icon size={10} />}
                              sx={{ fontSize: '0.65rem', fontWeight: 600, '--Chip-minHeight': '20px', flexShrink: 0 }}
                            >
                              {cfg.label}
                            </Chip>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Quick facts card */}
            <Card variant="outlined" sx={{ borderRadius: '16px', flexShrink: 0 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.25 }}>
                  Response times
                </Typography>
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography level="body-sm">General</Typography>
                    <Typography level="body-sm" fontWeight={600}>Within 24h</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography level="body-sm">Urgent</Typography>
                    <Typography level="body-sm" fontWeight={600} sx={{ color: 'warning.600' }}>Within 4h</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography level="body-sm">Billing</Typography>
                    <Typography level="body-sm" fontWeight={600}>Next business day</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>

      {/* Create ticket modal */}
      {createOpen && (
        <CreateTicketModal
          initial={initialTicketState || undefined}
          onClose={() => { setCreateOpen(false); setInitialTicketState(null); }}
          onCreated={(id) => {
            setCreateOpen(false);
            setInitialTicketState(null);
            router.push(`/support/tickets/${id}`);
          }}
        />
      )}
    </Box>
  );
}

// ============================================================================
// AI Chat Widget
// ============================================================================

interface AiMessage {
  role: 'user' | 'ai';
  content: string;
  id: string;
}

function AiChatWidget({ onEscalate }: { onEscalate: (transcript: { role: 'user' | 'ai'; content: string }[]) => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Hi ${user?.displayName?.split(' ')[0] || 'there'} 👋 I'm the Flowbooks support assistant. Ask me anything — how to create an invoice, reconcile a bank account, change your plan, or anything else about Flowbooks.\n\nIf I can't help, you can talk to a human at any time.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    if (!user) return;

    const userMsg: AiMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'AI is unavailable — please create a ticket.');
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`, role: 'ai',
          content: 'I ran into a problem answering. Would you like to create a support ticket so a human can help?',
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`, role: 'ai',
          content: data.reply || 'Sorry, I have no answer for that.',
        }]);
      }
    } catch {
      toast.error('Failed to reach the AI assistant');
    } finally {
      setSending(false);
    }
  };

  const transcriptForEscalation = messages
    .filter(m => m.id !== 'welcome')
    .map(m => ({ role: m.role, content: m.content }));

  return (
    <Card variant="outlined" sx={{
      borderRadius: '16px', p: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, width: '100%',
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
        px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
      }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(217,119,87,0.3)',
          }}>
            <Bot size={16} color="white" />
          </Box>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography level="title-sm" fontWeight={700}>Flowbooks AI</Typography>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.500' }} />
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Online · usually responds instantly
            </Typography>
          </Box>
        </Stack>

        {transcriptForEscalation.length > 0 && (
          <Button
            size="sm" variant="soft" color="warning"
            startDecorator={<User size={13} />}
            onClick={() => onEscalate(transcriptForEscalation)}
            sx={{ borderRadius: '10px', fontWeight: 600 }}
          >
            Talk to a human
          </Button>
        )}
      </Stack>

      {/* Messages */}
      <Box sx={{
        flex: 1, minHeight: 0, overflow: 'auto', px: { xs: 2, sm: 2.5 }, py: 2.5,
        bgcolor: 'background.level1',
      }}>
        <Stack spacing={1.75}>
          {messages.map(m => <ChatBubble key={m.id} message={m} />)}
          {sending && (
            <ChatBubble
              message={{ id: 'typing', role: 'ai', content: '' }}
              typing
            />
          )}
          <div ref={bottomRef} />
        </Stack>
      </Box>

      {/* Composer */}
      <Box sx={{
        flexShrink: 0,
        p: { xs: 1.5, sm: 2 },
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.surface',
      }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask about invoices, plans, bank reconciliation, or anything else…"
            minRows={1} maxRows={4}
            sx={{ flex: 1, borderRadius: '10px', fontSize: '0.9rem' }}
            disabled={sending}
          />
          <IconButton
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            sx={{
              bgcolor: '#D97757', color: 'white',
              borderRadius: '10px', width: 42, height: 42, flexShrink: 0,
              '&:hover': { bgcolor: '#C4694D' },
              '&:disabled': { bgcolor: 'neutral.300', color: 'white' },
            }}
          >
            {sending ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '14px', color: 'white' }} /> : <Send size={16} />}
          </IconButton>
        </Stack>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.75, textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </Typography>
      </Box>
    </Card>
  );
}

function ChatBubble({ message, typing }: { message: AiMessage; typing?: boolean }) {
  const isAi = message.role === 'ai';
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{
      justifyContent: isAi ? 'flex-start' : 'flex-end',
    }}>
      {isAi && (
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={13} color="white" />
        </Box>
      )}
      <Box sx={{
        maxWidth: '80%',
        px: 1.75, py: 1.25,
        borderRadius: isAi ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        bgcolor: isAi ? 'background.surface' : '#D97757',
        color: isAi ? 'text.primary' : 'white',
        border: isAi ? '1px solid' : 'none',
        borderColor: 'divider',
        boxShadow: isAi ? 'none' : '0 2px 6px rgba(217,119,87,0.25)',
      }}>
        {typing ? (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ py: 0.5 }}>
            {[0, 1, 2].map(i => (
              <Box key={i} sx={{
                width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.tertiary',
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
                '@keyframes pulse': {
                  '0%, 80%, 100%': { opacity: 0.3 },
                  '40%': { opacity: 1 },
                },
              }} />
            ))}
          </Stack>
        ) : (
          <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, color: 'inherit' }}>
            {message.content}
          </Typography>
        )}
      </Box>
      {!isAi && (
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          bgcolor: 'neutral.softBg', color: 'neutral.700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700,
        }}>
          <User size={13} />
        </Box>
      )}
    </Stack>
  );
}

// ============================================================================
// Create Ticket Modal
// ============================================================================

function CreateTicketModal({
  initial, onClose, onCreated,
}: {
  initial?: { subject?: string; description?: string; fromAiChat?: boolean; transcript?: { role: 'user' | 'ai'; content: string }[] };
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(initial?.subject || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category, priority,
          fromAiChat: initial?.fromAiChat || false,
          transcript: initial?.transcript || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create ticket');
        return;
      }
      toast.success('Ticket created — we will be in touch!');
      onCreated(data.id);
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={submitting ? undefined : onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 560 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
        <ModalClose disabled={submitting} />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', bgcolor: 'warning.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="#D97757" />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>Open a new ticket</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              {initial?.fromAiChat
                ? 'Your chat with our AI is attached — we will have the full context.'
                : 'Tell us what you need help with. A team member will reply within 24 hours.'}
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>Subject</FormLabel>
            <Input
              size="sm" value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Category</FormLabel>
              <Select
                size="sm" value={category}
                onChange={(_, v) => v && setCategory(v as TicketCategory)}
                sx={{ borderRadius: '8px' }}
              >
                <Option value="general">General question</Option>
                <Option value="bug">Bug / error</Option>
                <Option value="feature_request">Feature request</Option>
                <Option value="billing">Billing</Option>
                <Option value="account">Account</Option>
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Priority</FormLabel>
              <Select
                size="sm" value={priority}
                onChange={(_, v) => v && setPriority(v as TicketPriority)}
                sx={{ borderRadius: '8px' }}
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </FormControl>
          </Stack>

          <FormControl required>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you were trying to do, what happened, and what you expected to happen."
              minRows={5} maxRows={12}
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            startDecorator={<ArrowRight size={14} />}
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
          >
            Submit ticket
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
