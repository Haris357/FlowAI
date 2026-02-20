'use client';
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, Chip, Divider,
  Table, Sheet, Skeleton,
} from '@mui/joy';
import { ExternalLink, Receipt, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getBillingHistory } from '@/services/subscription';
import PricingCards from '@/components/subscription/PricingCards';
import PlanBadge from '@/components/subscription/PlanBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { BillingEvent, PlanId } from '@/types/subscription';

export default function SubscriptionSection() {
  const { user } = useAuth();
  const { subscription, plan, loading: subLoading } = useSubscription();
  const [billingHistory, setBillingHistory] = useState<BillingEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingHistory(true);
    getBillingHistory(user.uid)
      .then(setBillingHistory)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [user?.uid]);

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === 'free' || !user?.uid) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create checkout'); return; }
      window.location.href = data.checkoutUrl;
    } catch { toast.error('Failed to initiate checkout'); }
    finally { setCheckoutLoading(false); }
  };

  const handleManageSubscription = async () => {
    if (!user?.uid) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/subscription/portal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to open portal'); return; }
      window.open(data.portalUrl, '_blank');
    } catch { toast.error('Failed to open customer portal'); }
    finally { setPortalLoading(false); }
  };

  const statusColor = subscription?.status === 'active' ? 'success'
    : subscription?.status === 'cancelled' ? 'warning'
    : subscription?.status === 'past_due' ? 'danger' : 'neutral';

  return (
    <Stack spacing={3}>
      {/* Current Plan */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 44, height: 44, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Crown size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Box>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Current Plan
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography level="h4" fontWeight={700}>{plan.name}</Typography>
                  <PlanBadge />
                </Stack>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  ${plan.price}/month
                </Typography>
              </Box>
            </Stack>
            <Chip size="sm" variant="soft" color={statusColor} sx={{ textTransform: 'capitalize' }}>
              {subscription?.status || 'active'}
            </Chip>
          </Stack>

          {subscription?.cancelAt && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 'sm', bgcolor: 'warning.softBg' }}>
              <Typography level="body-xs" sx={{ color: 'warning.700' }}>
                Your subscription will cancel at the end of the billing period.
              </Typography>
            </Box>
          )}

          {subscription?.lemonSqueezySubscriptionId && (
            <Button variant="outlined" color="neutral" size="sm" sx={{ mt: 2 }}
              endDecorator={<ExternalLink size={14} />} loading={portalLoading}
              onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Box>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 2 }}>Choose Your Plan</Typography>
        <PricingCards onSelectPlan={handleSelectPlan} loading={checkoutLoading} />
      </Box>

      {/* Billing History */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, pt: 2.5, pb: 2 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>Billing History</Typography>
          </Stack>
          <Divider />
          <Sheet sx={{ overflow: 'auto' }}>
            <Table size="sm" sx={{
              '& th': {
                bgcolor: 'background.level1', fontWeight: 600, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.tertiary',
              },
            }}>
              <thead>
                <tr><th>Date</th><th>Description</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  [1, 2, 3].map(i => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width={80} /></td>
                      <td><Skeleton variant="text" width={140} /></td>
                      <td><Skeleton variant="text" width={60} /></td>
                      <td><Skeleton variant="text" width={50} sx={{ ml: 'auto' }} /></td>
                      <td></td>
                    </tr>
                  ))
                ) : billingHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <Typography level="body-sm" sx={{ py: 4, textAlign: 'center', color: 'text.tertiary' }}>
                        No billing history yet.
                      </Typography>
                    </td>
                  </tr>
                ) : billingHistory.map(event => (
                  <tr key={event.id}>
                    <td>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {event.createdAt && (event.createdAt as any).toDate
                          ? format((event.createdAt as any).toDate(), 'MMM dd, yyyy') : '-'}
                      </Typography>
                    </td>
                    <td><Typography level="body-xs" fontWeight={600}>{event.description}</Typography></td>
                    <td>
                      <Chip size="sm" variant="soft" color={
                        event.type === 'payment_failed' ? 'danger' : event.type === 'refund' ? 'warning'
                        : event.type === 'token_purchase' ? 'primary' : 'success'
                      } sx={{ fontSize: '10px' }}>
                        {event.type.replace(/_/g, ' ')}
                      </Chip>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-xs" fontWeight={600}>
                        {event.amount !== 0 ? `$${Math.abs(event.amount).toFixed(2)}` : '-'}
                      </Typography>
                    </td>
                    <td>
                      {event.invoiceUrl && (
                        <Button size="sm" variant="plain" onClick={() => window.open(event.invoiceUrl!, '_blank')}>
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        </CardContent>
      </Card>
    </Stack>
  );
}
