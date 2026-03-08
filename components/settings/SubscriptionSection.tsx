'use client';
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, Chip, Divider,
  Table, Sheet, Skeleton, CircularProgress,
} from '@mui/joy';
import {
  ExternalLink, Receipt, Crown, Calendar, CreditCard, AlertTriangle,
  Clock, Check, Zap, Pause, Play, X as XIcon, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@mui/joy/styles';
import { getBillingHistory } from '@/services/subscription';
import PricingCards from '@/components/subscription/PricingCards';
import PlanBadge from '@/components/subscription/PlanBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { PLANS, formatMessages, TRIAL_DURATION_DAYS } from '@/lib/plans';
import type { BillingEvent, PlanId } from '@/types/subscription';

function formatTimestamp(ts: any): string {
  if (!ts) return '-';
  try {
    const date = ts.toDate?.() || new Date(ts._seconds * 1000 || ts.seconds * 1000);
    return format(date, 'MMM dd, yyyy');
  } catch {
    return '-';
  }
}

export default function SubscriptionSection() {
  const { user } = useAuth();
  const {
    subscription, plan, loading: subLoading, isPaidSubscriber,
    isTrial, isTrialExpired: trialExpired, trialTimeLeft,
  } = useSubscription();
  const { mode } = useColorScheme();
  const [billingHistory, setBillingHistory] = useState<BillingEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isDark = mode === 'dark';

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

  const handleSubscriptionAction = async (action: string, confirmMsg?: string) => {
    if (!user?.uid) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setActionLoading(action);
    try {
      const res = await fetch('/api/subscription/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Action failed'); return; }
      toast.success(data.message || 'Done');
      // Subscription will update via Firestore listener after webhook fires
    } catch { toast.error('Failed to perform action'); }
    finally { setActionLoading(null); }
  };

  // Derived state
  const status = subscription?.status;
  const isCancelled = status === 'cancelled';
  const isPaused = status === 'paused';
  const isPastDue = status === 'past_due';
  const hasLsSub = !!subscription?.lemonSqueezySubscriptionId;

  const statusColor = isPaidSubscriber && !isCancelled && !isPaused && !isPastDue
    ? 'success'
    : isCancelled ? 'warning'
    : isPaused ? 'neutral'
    : isPastDue ? 'danger'
    : trialExpired ? 'danger'
    : isTrial ? 'primary'
    : 'neutral';

  const statusLabel = isPaidSubscriber && !isCancelled && !isPaused && !isPastDue
    ? 'Active'
    : isCancelled ? 'Cancelling'
    : isPaused ? 'Paused'
    : isPastDue ? 'Past Due'
    : trialExpired ? 'Expired'
    : isTrial ? 'Trial'
    : 'Inactive';

  return (
    <Stack spacing={3}>
      {/* ============ Current Plan Card ============ */}
      <Card variant="outlined" sx={{ overflow: 'hidden', borderRadius: '14px' }}>
        {/* Plan header with gradient */}
        <Box sx={{
          px: 3, py: 2.5,
          background: isPaidSubscriber && !isCancelled && !isPastDue
            ? 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)'
            : trialExpired || isPastDue
            ? 'linear-gradient(135deg, #B91C1C 0%, #D97757 100%)'
            : isTrial
            ? 'linear-gradient(135deg, #D97757 0%, #E8956F 100%)'
            : isDark ? 'neutral.800' : 'neutral.100',
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Crown size={20} color={isPaidSubscriber || isTrial ? 'white' : undefined} />
              </Box>
              <Box>
                <Typography sx={{
                  fontWeight: 800, fontSize: '1.1rem',
                  color: isPaidSubscriber || isTrial || trialExpired || isPastDue ? '#fff' : 'text.primary',
                }}>
                  {isPaidSubscriber ? plan.name : trialExpired ? 'Trial Expired' : isTrial ? `${plan.name} Trial` : plan.name}
                </Typography>
                <Typography sx={{
                  fontSize: '0.8rem',
                  color: isPaidSubscriber || isTrial || trialExpired || isPastDue ? 'rgba(255,255,255,0.85)' : 'text.secondary',
                }}>
                  {isPaidSubscriber
                    ? `$${plan.price}/month`
                    : trialExpired
                    ? 'Subscribe to continue using Flowbooks'
                    : isTrial && trialTimeLeft
                    ? `${trialTimeLeft} remaining`
                    : `$${plan.price}/month`}
                </Typography>
              </Box>
            </Stack>
            <Chip size="sm" variant="solid" sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: isPaidSubscriber || isTrial || trialExpired || isPastDue ? '#fff' : undefined,
              fontWeight: 700, fontSize: '0.7rem',
            }}>
              {statusLabel}
            </Chip>
          </Stack>
        </Box>

        {/* Plan details */}
        <CardContent sx={{ p: 3 }}>
          {/* Subscription details grid */}
          {hasLsSub && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
              gap: 2, mb: 2.5,
            }}>
              <DetailItem
                icon={<Calendar size={14} />}
                label="Billing Period"
                value={subscription?.currentPeriodEnd ? formatTimestamp(subscription.currentPeriodEnd) : '-'}
                sublabel="Renews on"
              />
              <DetailItem
                icon={<CreditCard size={14} />}
                label="Amount"
                value={`$${plan.price}/mo`}
              />
              <DetailItem
                icon={<Clock size={14} />}
                label="Started"
                value={subscription?.currentPeriodStart ? formatTimestamp(subscription.currentPeriodStart) : formatTimestamp(subscription?.createdAt)}
              />
            </Box>
          )}

          {/* Trial info */}
          {isTrial && !trialExpired && (
            <Box sx={{
              p: 1.5, mb: 2.5, borderRadius: '10px',
              bgcolor: isDark ? 'rgba(217,119,87,0.12)' : '#FFF5F0',
              border: '1px solid',
              borderColor: isDark ? 'rgba(217,119,87,0.25)' : '#FFE0D0',
            }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Clock size={16} color="#D97757" />
                <Box>
                  <Typography level="body-sm" fontWeight={700} sx={{ color: '#D97757' }}>
                    {trialTimeLeft || `${TRIAL_DURATION_DAYS} days`} remaining on your trial
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Subscribe now to keep all your data and features
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Cancellation notice */}
          {isCancelled && subscription?.cancelAt && (
            <Box sx={{
              p: 1.5, mb: 2.5, borderRadius: '10px',
              bgcolor: isDark ? 'rgba(234,179,8,0.1)' : '#FFFBEB',
              border: '1px solid',
              borderColor: isDark ? 'rgba(234,179,8,0.2)' : '#FEF3C7',
            }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <AlertTriangle size={16} color="#D97706" />
                <Box>
                  <Typography level="body-sm" fontWeight={700} sx={{ color: '#D97706' }}>
                    Cancelling on {formatTimestamp(subscription.cancelAt)}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    You'll have access until the end of your billing period
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Past due warning */}
          {isPastDue && (
            <Box sx={{
              p: 1.5, mb: 2.5, borderRadius: '10px',
              bgcolor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
              border: '1px solid',
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
            }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <AlertTriangle size={16} color="#DC2626" />
                <Box>
                  <Typography level="body-sm" fontWeight={700} sx={{ color: '#DC2626' }}>
                    Payment failed
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Please update your payment method to avoid losing access
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Trial expired */}
          {trialExpired && !hasLsSub && (
            <Box sx={{
              p: 1.5, mb: 2.5, borderRadius: '10px',
              bgcolor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
              border: '1px solid',
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
            }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Clock size={16} color="#DC2626" />
                <Box>
                  <Typography level="body-sm" fontWeight={700} sx={{ color: '#DC2626' }}>
                    Your trial has expired
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Subscribe to a plan below to continue using Flowbooks
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Plan features */}
          {(isPaidSubscriber || isTrial) && !trialExpired && (
            <>
              <Typography level="body-xs" sx={{
                color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700,
                letterSpacing: '0.06em', mb: 1.25,
              }}>
                Plan Features
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 0.75, mb: 2.5,
              }}>
                {[
                  `${formatMessages(plan.sessionMessageLimit)} AI messages/session`,
                  `${formatMessages(plan.weeklyMessageLimit)} messages/week`,
                  `Up to ${plan.maxCompanies} companies`,
                  plan.maxCollaboratorsPerCompany === -1 ? 'Unlimited collaborators' : `${plan.maxCollaboratorsPerCompany} collaborators/company`,
                  plan.features.allReports ? 'All financial reports' : 'Basic reports',
                  plan.features.payroll ? 'Payroll & salary slips' : null,
                ].filter(Boolean).map((f, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Check size={12} color="#D97757" style={{ flexShrink: 0 }} />
                    <Typography level="body-xs">{f}</Typography>
                  </Stack>
                ))}
              </Box>
            </>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {hasLsSub && (
              <>
                <Button
                  variant="outlined" color="neutral" size="sm"
                  endDecorator={<ExternalLink size={12} />}
                  loading={portalLoading}
                  onClick={handleManageSubscription}
                  sx={{ borderRadius: '8px' }}
                >
                  Customer Portal
                </Button>

                {isCancelled && (
                  <Button
                    variant="soft" color="success" size="sm"
                    startDecorator={<Play size={12} />}
                    loading={actionLoading === 'resume'}
                    onClick={() => handleSubscriptionAction('resume')}
                    sx={{ borderRadius: '8px' }}
                  >
                    Resume Subscription
                  </Button>
                )}

                {isPaidSubscriber && !isCancelled && !isPaused && (
                  <>
                    <Button
                      variant="plain" color="warning" size="sm"
                      startDecorator={<Pause size={12} />}
                      loading={actionLoading === 'pause'}
                      onClick={() => handleSubscriptionAction('pause', 'Pause your subscription? You won\'t be charged during the pause, but you\'ll lose access to premium features.')}
                      sx={{ borderRadius: '8px' }}
                    >
                      Pause
                    </Button>
                    <Button
                      variant="plain" color="danger" size="sm"
                      startDecorator={<XIcon size={12} />}
                      loading={actionLoading === 'cancel'}
                      onClick={() => handleSubscriptionAction('cancel', 'Cancel your subscription? You\'ll keep access until the end of your current billing period.')}
                      sx={{ borderRadius: '8px' }}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {isPaused && (
                  <Button
                    variant="soft" color="primary" size="sm"
                    startDecorator={<Play size={12} />}
                    loading={actionLoading === 'unpause'}
                    onClick={() => handleSubscriptionAction('unpause')}
                    sx={{ borderRadius: '8px' }}
                  >
                    Unpause Subscription
                  </Button>
                )}

                {isPastDue && (
                  <Button
                    variant="solid" color="danger" size="sm"
                    startDecorator={<CreditCard size={12} />}
                    loading={portalLoading}
                    onClick={handleManageSubscription}
                    sx={{ borderRadius: '8px' }}
                  >
                    Update Payment Method
                  </Button>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ============ Choose Plan ============ */}
      <Box>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 2 }}>
          {hasLsSub ? 'Change Plan' : 'Choose Your Plan'}
        </Typography>
        <PricingCards onSelectPlan={handleSelectPlan} loading={checkoutLoading} />
      </Box>

      {/* ============ Billing History ============ */}
      <Card variant="outlined" sx={{ borderRadius: '14px' }}>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, pt: 2.5, pb: 2 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              bgcolor: isDark ? 'rgba(217,119,87,0.15)' : '#FFF0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt size={16} color="#D97757" />
            </Box>
            <Typography level="title-md" fontWeight={700}>Billing History</Typography>
          </Stack>
          <Divider />
          <Sheet sx={{ overflow: 'auto' }}>
            <Table size="sm" sx={{
              '& th': {
                bgcolor: isDark ? 'neutral.800' : 'neutral.50',
                fontWeight: 600, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                color: 'text.tertiary', py: 1.25,
              },
              '& td': { py: 1.25 },
            }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 50 }}></th>
                </tr>
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
                      <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                        <Receipt size={24} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                          No billing history yet
                        </Typography>
                      </Stack>
                    </td>
                  </tr>
                ) : billingHistory.map(event => (
                  <tr key={event.id}>
                    <td>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {formatTimestamp(event.createdAt)}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-xs" fontWeight={600}>
                        {event.description}
                      </Typography>
                    </td>
                    <td>
                      <Chip size="sm" variant="soft" color={
                        event.type === 'payment_failed' ? 'danger'
                        : event.type === 'refund' ? 'warning'
                        : event.type === 'subscription_cancelled' ? 'warning'
                        : 'success'
                      } sx={{ fontSize: '10px', fontWeight: 600 }}>
                        {event.type === 'subscription_created' ? 'Subscribed'
                          : event.type === 'subscription_renewed' ? 'Renewed'
                          : event.type === 'subscription_cancelled' ? 'Cancelled'
                          : event.type === 'subscription_updated' ? 'Updated'
                          : event.type === 'payment_failed' ? 'Failed'
                          : event.type === 'refund' ? 'Refunded'
                          : event.type.replace(/_/g, ' ')}
                      </Chip>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-xs" fontWeight={600} sx={{
                        color: event.amount < 0 ? 'danger.500' : event.amount > 0 ? 'text.primary' : 'text.tertiary',
                      }}>
                        {event.amount !== 0
                          ? `${event.amount < 0 ? '-' : ''}$${Math.abs(event.amount).toFixed(2)}`
                          : '-'}
                      </Typography>
                    </td>
                    <td>
                      {event.invoiceUrl && (
                        <Button size="sm" variant="plain" color="neutral"
                          onClick={() => window.open(event.invoiceUrl!, '_blank')}
                          sx={{ minWidth: 0, p: 0.5 }}
                        >
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

function DetailItem({ icon, label, value, sublabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Box sx={{
      p: 1.5, borderRadius: '10px',
      bgcolor: 'background.level1',
      border: '1px solid', borderColor: 'divider',
    }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
        <Box sx={{ color: 'text.tertiary', display: 'flex' }}>{icon}</Box>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600 }}>
          {sublabel || label}
        </Typography>
      </Stack>
      <Typography level="body-sm" fontWeight={700}>{value}</Typography>
    </Box>
  );
}
