'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip,
  Button, Skeleton, Divider,
} from '@mui/joy';
import { HelpCircle, CheckCircle, Inbox, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

const STATUS_COLORS: Record<string, 'warning' | 'primary' | 'success' | 'neutral'> = {
  open: 'warning', in_progress: 'primary', resolved: 'success', closed: 'neutral',
};

const PRIORITY_COLORS: Record<string, 'neutral' | 'primary' | 'warning' | 'danger'> = {
  low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/support')
      .then(res => res.json())
      .then(d => setTickets(d.tickets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateTicket = async (ticketId: string, status: string) => {
    setUpdating(ticketId);
    try {
      const res = await adminFetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Ticket updated');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>Support Tickets</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Manage customer support tickets.
          </Typography>
        </Box>

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="45%" sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="75%" />
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Skeleton variant="text" width={100} />
                        <Skeleton variant="rectangular" width={55} height={18} sx={{ borderRadius: 10 }} />
                        <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 10 }} />
                      </Stack>
                    </Box>
                    <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 10 }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : tickets.length === 0 ? (
          <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No support tickets yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {tickets.map(ticket => (
              <Card key={ticket.id} sx={{
                ...adminCard as Record<string, unknown>,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'neutral.400' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography level="body-sm" fontWeight={600}>{ticket.subject}</Typography>
                      </Stack>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>
                        {ticket.description?.slice(0, 200)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {ticket.userName || ticket.userEmail}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          &bull; {formatDate(ticket.createdAt)}
                        </Typography>
                        {ticket.category && (
                          <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px' }}>
                            {ticket.category}
                          </Chip>
                        )}
                        {ticket.priority && (
                          <Chip size="sm" variant="soft" color={PRIORITY_COLORS[ticket.priority] || 'neutral'}
                            sx={{ fontSize: '10px' }}>
                            {ticket.priority}
                          </Chip>
                        )}
                      </Stack>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                      <Chip size="sm" variant="soft" color={STATUS_COLORS[ticket.status] || 'neutral'}
                        sx={{ fontSize: '10px' }}>
                        {ticket.status?.replace(/_/g, ' ')}
                      </Chip>
                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <Button size="sm" variant="soft" color="success"
                          startDecorator={<CheckCircle size={12} />}
                          onClick={() => handleUpdateTicket(ticket.id, 'resolved')}
                          loading={updating === ticket.id}
                          sx={{ fontSize: '11px' }}>
                          Resolve
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
