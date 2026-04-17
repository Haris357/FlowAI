'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Stack, Card, Button, Chip, Divider, IconButton, CircularProgress,
  Modal, ModalDialog, ModalClose, Sheet,
} from '@mui/joy';
import {
  ArrowLeft, CreditCard, Download, ExternalLink, RefreshCw,
  XCircle, CheckCircle2, AlertTriangle, Clock, Receipt, Sparkles,
  ArrowRight, ArrowUpRight, ShieldCheck, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { getBillingHistory } from '@/services/subscription';
import PricingCards from '@/components/subscription/PricingCards';
import type { BillingEvent, PlanId } from '@/types/subscription';

const BRAND = '#D97757';
const BRAND_DARK = '#C4694D';

function fmtDate(d?: Date | null): string {
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function fmtDateLong(d?: Date | null): string {
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts.toMillis === 'function') return new Date(ts.toMillis());
  if (ts.seconds != null) return new Date(ts.seconds * 1000);
  if (ts._seconds != null) return new Date(ts._seconds * 1000);
  return null;
}

function fmtMoney(n: number): string {
  const isNegative = n < 0;
  const abs = Math.abs(n || 0);
  return `${isNegative ? '-' : ''}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    plan, subscription, isPaidSubscriber, isTrial, trialEndsAt, trialTimeLeft,
    refreshSubscription,
  } = useSubscription();
  const { showSubscriptionSuccess } = useSettingsModal();

  const [history, setHistory] = useState<BillingEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshSubscription();
      const t = setTimeout(() => showSubscriptionSuccess(), 1200);
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
      return () => clearTimeout(t);
    }
  }, [searchParams, refreshSubscription, showSubscriptionSuccess]);

  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    setHistoryLoading(true);
    try {
      const events = await getBillingHistory(user.uid, 100);
      setHistory(events);
    } catch (err) {
      console.error('Failed to load billing history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleOpenPortal = async () => {
    if (!user?.uid) return;
    setActionLoading('portal');
    try {
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open portal');
      window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err.message || 'Could not open payment portal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!user?.uid) return;
    setActionLoading('cancel');
    try {
      const res = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast.success(data.message || 'Subscription cancelled');
      setConfirmCancel(false);
      await refreshSubscription();
      await loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'Could not cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    if (!user?.uid) return;
    setActionLoading('resume');
    try {
      const res = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action: 'resume' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resume');
      toast.success(data.message || 'Subscription resumed');
      await refreshSubscription();
    } catch (err: any) {
      toast.error(err.message || 'Could not resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = async (planId: PlanId, billingPeriod: 'monthly' | 'yearly') => {
    if (!user?.uid) return;
    setActionLoading(`checkout_${planId}`);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, planId, billingPeriod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      toast.error(err.message || 'Could not start checkout');
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (event: BillingEvent) => {
    if (!user?.uid) return;
    setActionLoading(`invoice_${event.id}`);
    try {
      const res = await fetch(
        `/api/subscription/invoice/${event.id}?userId=${user.uid}`,
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(err.error || 'Download failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Could not download invoice');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived state ──
  const status = subscription?.status || 'none';
  const periodEnd = tsToDate(subscription?.currentPeriodEnd as any);
  const periodStart = tsToDate(subscription?.currentPeriodStart as any);
  const cancelAt = tsToDate(subscription?.cancelAt as any);
  const createdAt = tsToDate(subscription?.createdAt as any);
  const isCancelling = status === 'cancelled' && !!cancelAt && cancelAt.getTime() > Date.now();
  const hasEnded = status === 'cancelled' && !isCancelling;

  let statusLabel = 'Inactive';
  let statusTone: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
  if (isTrial) { statusLabel = 'On trial'; statusTone = 'warning'; }
  else if (isCancelling) { statusLabel = 'Cancelling'; statusTone = 'warning'; }
  else if (status === 'active') { statusLabel = 'Active'; statusTone = 'success'; }
  else if (status === 'past_due') { statusLabel = 'Past due'; statusTone = 'danger'; }
  else if (status === 'paused') { statusLabel = 'Paused'; statusTone = 'neutral'; }
  else if (status === 'trialing') { statusLabel = 'On trial'; statusTone = 'warning'; }
  else if (hasEnded) { statusLabel = 'Ended'; statusTone = 'danger'; }

  const isYearly =
    !!plan.yearlyLemonSqueezyVariantId &&
    subscription?.lemonSqueezyVariantId === plan.yearlyLemonSqueezyVariantId;

  const displayPrice = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
  const priceSuffix = !isPaidSubscriber ? '' : isYearly ? '/year' : '/month';

  const canCancel = isPaidSubscriber && status === 'active' && !isCancelling;
  const canResume = isPaidSubscriber && isCancelling;
  const canUpgrade = !isPaidSubscriber || plan.id !== 'max';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* ── Top Bar ── */}
      <Box sx={{
        px: { xs: 2, md: 5 }, py: 2.5,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'background.body',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ maxWidth: 1100, mx: 'auto' }}>
          <IconButton
            variant="plain"
            color="neutral"
            onClick={() => router.push('/companies')}
            sx={{ borderRadius: 'md' }}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Typography level="title-lg" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
            Billing
          </Typography>
        </Stack>
      </Box>

      <Box sx={{
        maxWidth: 1100, mx: 'auto',
        px: { xs: 2, md: 5 },
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 10 },
      }}>
        <Stack spacing={{ xs: 4, md: 5 }}>

          {/* ── Page header ── */}
          <Box>
            <Typography level="h2" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              Your subscription
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.tertiary', maxWidth: 640 }}>
              Manage your plan, payment method and invoices. Changes apply at the end of your current billing period.
            </Typography>
          </Box>

          {/* ── Status banners ── */}
          {isTrial && trialTimeLeft && (
            <StatusBanner
              tone="warning"
              icon={<Sparkles size={18} />}
              title={`${trialTimeLeft} left on your free trial`}
              body={`Subscribe before ${fmtDateLong(trialEndsAt ? new Date(trialEndsAt) : null)} to keep access without interruption.`}
              action={canUpgrade ? (
                <Button
                  size="sm"
                  variant="solid"
                  sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK } }}
                  onClick={() => setShowPlans(true)}
                >
                  Subscribe
                </Button>
              ) : null}
            />
          )}

          {isCancelling && (
            <StatusBanner
              tone="warning"
              icon={<Clock size={18} />}
              title="Your subscription is scheduled to end"
              body={<>You'll keep access to <strong>{plan.name}</strong> until <strong>{fmtDateLong(cancelAt)}</strong>. After that, your workspace moves to the Free plan.</>}
              action={canResume ? (
                <Button
                  size="sm"
                  variant="solid"
                  color="warning"
                  loading={actionLoading === 'resume'}
                  onClick={handleResume}
                >
                  Keep subscription
                </Button>
              ) : null}
            />
          )}

          {status === 'past_due' && (
            <StatusBanner
              tone="danger"
              icon={<AlertTriangle size={18} />}
              title="Payment needs attention"
              body="Your last payment didn't go through. Update your payment method to avoid losing access."
              action={
                <Button
                  size="sm"
                  variant="solid"
                  color="danger"
                  loading={actionLoading === 'portal'}
                  onClick={handleOpenPortal}
                  endDecorator={<ExternalLink size={14} />}
                >
                  Update payment
                </Button>
              }
            />
          )}

          {/* ── Hero Plan Card ── */}
          <Card
            variant="outlined"
            sx={{
              p: 0, overflow: 'hidden',
              borderRadius: '20px',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Box sx={{
              position: 'relative',
              p: { xs: 3, md: 5 },
              background: `radial-gradient(1200px 300px at -10% -40%, ${BRAND}22 0%, transparent 55%), radial-gradient(800px 260px at 110% 120%, ${BRAND}18 0%, transparent 55%)`,
            }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 3, md: 4 }}
                alignItems={{ md: 'flex-end' }}
                justifyContent="space-between"
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={statusTone}
                      sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        letterSpacing: '0.02em',
                        '--Chip-minHeight': '24px',
                      }}
                      startDecorator={
                        <Box sx={{
                          width: 6, height: 6, borderRadius: '50%',
                          bgcolor: `${statusTone}.500`,
                        }} />
                      }
                    >
                      {statusLabel}
                    </Chip>
                    {isYearly && (
                      <Chip
                        size="sm"
                        variant="outlined"
                        color="neutral"
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      >
                        Billed annually
                      </Chip>
                    )}
                  </Stack>

                  <Box>
                    <Typography
                      level="body-sm"
                      sx={{ color: 'text.tertiary', fontWeight: 600, mb: 0.5 }}
                    >
                      Current plan
                    </Typography>
                    <Typography
                      level="h1"
                      fontWeight={800}
                      sx={{
                        letterSpacing: '-0.03em',
                        fontSize: { xs: '2.25rem', md: '2.75rem' },
                        lineHeight: 1.05,
                      }}
                    >
                      {plan.name}
                    </Typography>
                    {plan.description && (
                      <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1, maxWidth: 480 }}>
                        {plan.description}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography
                      level="h2"
                      fontWeight={800}
                      sx={{ letterSpacing: '-0.02em', color: BRAND }}
                    >
                      ${displayPrice}
                    </Typography>
                    {priceSuffix && (
                      <Typography level="body-md" sx={{ color: 'text.tertiary', fontWeight: 600 }}>
                        {priceSuffix}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ minWidth: { md: 280 } }}>
                  {canUpgrade && (
                    <Button
                      size="lg"
                      variant="solid"
                      onClick={() => setShowPlans(true)}
                      endDecorator={<ArrowRight size={16} />}
                      sx={{
                        bgcolor: BRAND,
                        '&:hover': { bgcolor: BRAND_DARK },
                        fontWeight: 700, borderRadius: 'lg',
                        px: 2.5,
                      }}
                    >
                      {isPaidSubscriber ? 'Change plan' : 'Choose a plan'}
                    </Button>
                  )}
                  {isPaidSubscriber && (
                    <Button
                      size="lg"
                      variant="outlined"
                      color="neutral"
                      loading={actionLoading === 'portal'}
                      onClick={handleOpenPortal}
                      endDecorator={<ExternalLink size={14} />}
                      sx={{ fontWeight: 700, borderRadius: 'lg' }}
                    >
                      Billing portal
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>

            <Divider />

            {/* Plan meta row */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              '& > div + div': {
                borderLeft: { sm: '1px solid' },
                borderColor: { sm: 'divider' },
                borderTop: { xs: '1px solid', sm: 'none' },
              },
            }}>
              <MetaCell
                label={isCancelling ? 'Access ends' : isPaidSubscriber ? 'Next renewal' : 'Status'}
                value={
                  isCancelling ? fmtDateLong(cancelAt)
                  : isPaidSubscriber ? fmtDateLong(periodEnd)
                  : isTrial ? `Trial – ${trialTimeLeft || 'active'}`
                  : 'Free plan'
                }
              />
              <MetaCell
                label="Billing cycle"
                value={isYearly ? 'Annual' : isPaidSubscriber ? 'Monthly' : '—'}
              />
              <MetaCell
                label="Member since"
                value={fmtDateLong(createdAt)}
              />
            </Box>
          </Card>

          {/* ── Payment & security row ── */}
          {isPaidSubscriber && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2.5,
            }}>
              <InfoTile
                icon={<CreditCard size={18} />}
                title="Payment method"
                body="Update your card, billing address or tax details in the secure Lemon Squeezy portal."
                cta={
                  <Button
                    variant="plain"
                    size="sm"
                    endDecorator={<ArrowUpRight size={14} />}
                    loading={actionLoading === 'portal'}
                    onClick={handleOpenPortal}
                    sx={{ ml: -1, color: BRAND, fontWeight: 700, '&:hover': { bgcolor: `${BRAND}14` } }}
                  >
                    Manage
                  </Button>
                }
              />
              <InfoTile
                icon={<ShieldCheck size={18} />}
                title="Secure billing"
                body="Payments are processed by Lemon Squeezy. We never see or store your card details."
                cta={
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600 }}>
                    PCI-DSS Level 1 · SSL encrypted
                  </Typography>
                }
              />
            </Box>
          )}

          {/* ── Billing history ── */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography level="title-lg" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                  Billing history
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  Payments, renewals and refunds on your account
                </Typography>
              </Box>
              <IconButton
                variant="plain"
                color="neutral"
                size="sm"
                onClick={loadHistory}
                disabled={historyLoading}
                sx={{ borderRadius: 'md' }}
              >
                <RefreshCw size={14} />
              </IconButton>
            </Stack>

            <Card
              variant="outlined"
              sx={{
                p: 0, overflow: 'hidden',
                borderRadius: '16px',
                borderColor: 'divider',
                boxShadow: 'none',
              }}
            >
              {historyLoading ? (
                <Stack alignItems="center" sx={{ py: 8 }}>
                  <CircularProgress size="sm" />
                </Stack>
              ) : history.length === 0 ? (
                <Stack alignItems="center" spacing={1.5} sx={{ py: 8, px: 3 }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '14px',
                    bgcolor: 'background.level1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Receipt size={22} style={{ color: 'var(--joy-palette-neutral-400)' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography level="body-md" fontWeight={700}>
                      No billing activity yet
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                      Your payments and invoices will show up here.
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Stack divider={<Divider />}>
                  {history.map((event) => (
                    <HistoryRow
                      key={event.id}
                      event={event}
                      downloading={actionLoading === `invoice_${event.id}`}
                      onDownload={() => handleDownloadInvoice(event)}
                    />
                  ))}
                </Stack>
              )}
            </Card>
          </Box>

          {/* ── Cancel (quiet) ── */}
          {canCancel && (
            <Box sx={{ pt: 2 }}>
              <Divider sx={{ mb: 3 }} />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography level="title-sm" fontWeight={700}>
                    Cancel subscription
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.25, maxWidth: 520 }}>
                    You'll keep access until {fmtDateLong(periodEnd)}. No refund is issued for remaining time.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="danger"
                  size="sm"
                  onClick={() => setConfirmCancel(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Cancel subscription
                </Button>
              </Stack>
            </Box>
          )}

        </Stack>
      </Box>

      {/* ── Plans Modal ── */}
      <Modal open={showPlans} onClose={() => setShowPlans(false)}>
        <ModalDialog
          size="lg"
          sx={{
            maxWidth: 920, width: '95vw',
            borderRadius: '20px',
            p: { xs: 2.5, md: 4 },
            maxHeight: '92vh',
            overflow: 'auto',
          }}
        >
          <ModalClose />
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Box>
              <Typography level="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                Choose your plan
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                Upgrade or downgrade anytime. Changes take effect on your next billing cycle.
              </Typography>
            </Box>
            <PricingCards
              onSelectPlan={(id, period) => {
                setShowPlans(false);
                handleCheckout(id, period);
              }}
              loading={!!actionLoading && actionLoading.startsWith('checkout_')}
              currentBillingPeriod={isYearly ? 'yearly' : 'monthly'}
            />
          </Stack>
        </ModalDialog>
      </Modal>

      {/* ── Cancel Confirm ── */}
      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)}>
        <ModalDialog role="alertdialog" sx={{ maxWidth: 460, borderRadius: '20px', p: 3 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px',
                bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={22} style={{ color: 'var(--joy-palette-danger-600)' }} />
              </Box>
              <Box>
                <Typography level="title-lg" fontWeight={800}>
                  Cancel subscription?
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                  You can resume any time before it ends
                </Typography>
              </Box>
            </Stack>

            <Sheet
              variant="soft"
              sx={{
                p: 2, borderRadius: 'lg',
                bgcolor: 'background.level1',
              }}
            >
              <Typography level="body-sm">
                You'll keep full access to <strong>{plan.name}</strong> features until{' '}
                <strong>{fmtDateLong(periodEnd)}</strong>. After that, your account will move to the Free plan.
              </Typography>
            </Sheet>

            <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ pt: 0.5 }}>
              <Button
                variant="plain"
                color="neutral"
                onClick={() => setConfirmCancel(false)}
              >
                Keep subscription
              </Button>
              <Button
                variant="solid"
                color="danger"
                loading={actionLoading === 'cancel'}
                onClick={handleCancel}
              >
                Confirm cancel
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}

// ──────────────────────────────────────────────────
// Helper components
// ──────────────────────────────────────────────────

function StatusBanner({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: 'warning' | 'danger' | 'success';
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  const palette = {
    warning: { bg: 'warning.softBg', border: 'warning.200', ic: 'warning.600' },
    danger:  { bg: 'danger.softBg',  border: 'danger.200',  ic: 'danger.600'  },
    success: { bg: 'success.softBg', border: 'success.200', ic: 'success.600' },
  }[tone];

  return (
    <Sheet
      variant="soft"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: '14px',
        bgcolor: palette.bg,
        border: '1px solid',
        borderColor: palette.border,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ sm: 'center' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.6)',
            color: palette.ic,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level="body-sm" fontWeight={700}>{title}</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {body}
            </Typography>
          </Box>
        </Stack>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
    </Sheet>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: 2.5 }}>
      <Typography
        level="body-xs"
        sx={{
          color: 'text.tertiary',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography level="body-md" fontWeight={700}>{value}</Typography>
    </Box>
  );
}

function InfoTile({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: '16px',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: `${BRAND}15`,
            color: BRAND,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </Box>
          <Typography level="title-sm" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.55 }}>
          {body}
        </Typography>
        {cta && <Box>{cta}</Box>}
      </Stack>
    </Card>
  );
}

function HistoryRow({
  event,
  downloading,
  onDownload,
}: {
  event: BillingEvent;
  downloading: boolean;
  onDownload: () => void;
}) {
  const date = tsToDate(event.createdAt as any);
  const canDownload = ['subscription_created', 'subscription_renewed'].includes(event.type);
  const isRefund = event.type === 'refund';
  const icon = getEventIcon(event.type);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'auto 1fr auto', md: 'auto 1fr auto auto' },
        alignItems: 'center',
        gap: { xs: 1.5, md: 2.5 },
        px: { xs: 2.5, md: 3.5 },
        py: 2,
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'background.level1' },
      }}
    >
      <Box sx={{
        width: 36, height: 36, borderRadius: '10px',
        bgcolor: icon.bg,
        color: icon.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon.node}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography level="body-sm" fontWeight={700} sx={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {event.description}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {fmtDate(date)}
          </Typography>
          {event.invoiceNumber && (
            <>
              <Box sx={{
                width: 3, height: 3, borderRadius: '50%',
                bgcolor: 'text.tertiary', opacity: 0.5,
              }} />
              <Typography
                level="body-xs"
                sx={{
                  color: 'text.tertiary',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '0.68rem',
                }}
              >
                {event.invoiceNumber}
              </Typography>
            </>
          )}
        </Stack>
      </Box>

      <Typography
        level="body-sm"
        fontWeight={700}
        sx={{
          color: isRefund ? 'danger.600' : 'text.primary',
          textAlign: 'right',
          minWidth: 80,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {event.amount === 0 ? '—' : fmtMoney(event.amount)}
      </Typography>

      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'flex-end',
        minWidth: 36,
      }}>
        {canDownload ? (
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            loading={downloading}
            onClick={onDownload}
            title="Download invoice"
            sx={{ borderRadius: 'md' }}
          >
            <Download size={15} />
          </IconButton>
        ) : (
          <Box sx={{ width: 34 }} />
        )}
      </Box>
    </Box>
  );
}

function getEventIcon(type: string): { node: React.ReactNode; color: string; bg: string } {
  switch (type) {
    case 'subscription_created':
      return { node: <Sparkles size={15} />, color: BRAND, bg: `${BRAND}15` };
    case 'subscription_renewed':
      return {
        node: <RefreshCw size={15} />,
        color: 'var(--joy-palette-success-700)',
        bg: 'var(--joy-palette-success-softBg)',
      };
    case 'subscription_cancelled':
    case 'subscription_ended':
      return {
        node: <XCircle size={15} />,
        color: 'var(--joy-palette-neutral-600)',
        bg: 'var(--joy-palette-neutral-softBg)',
      };
    case 'subscription_updated':
      return {
        node: <CheckCircle2 size={15} />,
        color: 'var(--joy-palette-primary-700)',
        bg: 'var(--joy-palette-primary-softBg)',
      };
    case 'payment_failed':
      return {
        node: <AlertTriangle size={15} />,
        color: 'var(--joy-palette-danger-700)',
        bg: 'var(--joy-palette-danger-softBg)',
      };
    case 'refund':
      return {
        node: <RefreshCw size={15} />,
        color: 'var(--joy-palette-danger-700)',
        bg: 'var(--joy-palette-danger-softBg)',
      };
    default:
      return {
        node: <Receipt size={15} />,
        color: 'var(--joy-palette-neutral-600)',
        bg: 'var(--joy-palette-neutral-softBg)',
      };
  }
}
