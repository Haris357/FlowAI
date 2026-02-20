'use client';
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, FormControl, FormLabel,
  Input, Textarea, Select, Option, Button, Chip, Divider, Skeleton,
} from '@mui/joy';
import { Send, HelpCircle, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createSupportTicket, getUserTickets } from '@/services/support';
import type { SupportTicket, TicketCategory, TicketPriority } from '@/types/support';
import { Timestamp } from 'firebase/firestore';

const STATUS_COLORS: Record<string, 'neutral' | 'primary' | 'success' | 'warning'> = {
  open: 'warning', in_progress: 'primary', resolved: 'success', closed: 'neutral',
};

export default function SupportSection() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingTickets(true);
    getUserTickets(user.uid).then(setTickets).catch(console.error).finally(() => setLoadingTickets(false));
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!subject.trim() || !description.trim()) { toast.error('Please fill in subject and description'); return; }
    setSubmitting(true);
    try {
      await createSupportTicket({
        userId: user.uid, userEmail: user.email || '', userName: user.displayName || '',
        subject: subject.trim(), category, priority, description: description.trim(),
      });
      toast.success('Ticket submitted successfully');
      setSubject(''); setDescription(''); setCategory('general'); setPriority('medium');
      const updated = await getUserTickets(user.uid);
      setTickets(updated);
    } catch { toast.error('Failed to submit ticket'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (ts: Timestamp | any) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Stack spacing={3}>
      {/* Submit Form */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HelpCircle size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>Submit a Ticket</Typography>
          </Stack>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel>Subject</FormLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue" />
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Category</FormLabel>
                <Select value={category} onChange={(_, v) => v && setCategory(v)}>
                  <Option value="general">General</Option>
                  <Option value="bug">Bug Report</Option>
                  <Option value="feature_request">Feature Request</Option>
                  <Option value="billing">Billing</Option>
                  <Option value="account">Account</Option>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Priority</FormLabel>
                <Select value={priority} onChange={(_, v) => v && setPriority(v)}>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </FormControl>
            </Stack>
            <FormControl required>
              <FormLabel>Description</FormLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..." minRows={4} />
            </FormControl>
            <Box>
              <Button startDecorator={<Send size={16} />} onClick={handleSubmit} loading={submitting}>
                Submit Ticket
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Ticket History */}
      <Box>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 1.5 }}>Your Tickets</Typography>
        {loadingTickets ? (
          <Stack spacing={1.5}>
            {[1, 2].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant="text" width="50%" sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="80%" />
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 10 }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : tickets.length === 0 ? (
          <Card variant="soft">
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Inbox size={32} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No tickets yet. Submit one above if you need help.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {tickets.map(ticket => (
              <Card key={ticket.id} variant="outlined" sx={{ transition: 'border-color 0.2s', '&:hover': { borderColor: 'neutral.400' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography level="body-sm" fontWeight={600} noWrap>{ticket.subject}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }} noWrap>
                        {ticket.description.slice(0, 120)}
                      </Typography>
                    </Box>
                    <Chip size="sm" variant="soft" color={STATUS_COLORS[ticket.status] || 'neutral'}
                      sx={{ fontSize: '10px', ml: 1, flexShrink: 0 }}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Chip>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{formatDate(ticket.createdAt)}</Typography>
                    <Chip size="sm" variant="outlined" sx={{ fontSize: '10px' }}>{ticket.category}</Chip>
                    <Chip size="sm" variant="outlined" sx={{ fontSize: '10px' }}>{ticket.priority}</Chip>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
