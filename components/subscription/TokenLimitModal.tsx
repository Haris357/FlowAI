'use client';

import {
  Modal, ModalDialog, ModalClose, Typography, Box, Stack, Button, Chip, Divider,
} from '@mui/joy';
import { AlertTriangle, Zap, ArrowRight, Check, Crown, Clock } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'next/navigation';
import { PLANS, formatMessages, getPlan } from '@/lib/plans';

function getUpgradeFeatures(currentPlanId: string, isTrial: boolean): string[] {
  if (currentPlanId === 'free' || isTrial) {
    const pro = PLANS.pro;
    return [
      'Extended AI usage per session & week',
      'Unlimited customers & invoices',
      'All financial reports & exports',
      'Payroll & salary slips',
      `Up to ${pro.maxCompanies} companies`,
    ];
  }
  if (currentPlanId === 'pro') {
    return [
      '3x more AI usage per session',
      '3.5x weekly AI allowance',
      'Advanced AI models',
      'Up to 10 companies',
      'Unlimited team members & email sends',
      'Priority support (24h)',
    ];
  }
  return [];
}

export default function TokenLimitModal() {
  const { messageLimitReached, dismissMessageLimit } = useChat();
  const { plan, usage, blockedBy, sessionRemaining, weeklyRemaining, sessionTimeLeft, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const router = useRouter();

  if (!messageLimitReached) return null;

  const planId = plan.id;
  const isTrialBlock = blockedBy === 'trial_expired' || trialExpired;
  const canUpgrade = planId !== 'max' || isTrialBlock;
  const nextPlan = isTrialBlock ? PLANS.pro : planId === 'free' ? PLANS.pro : planId === 'pro' ? PLANS.max : null;
  const features = getUpgradeFeatures(planId, isTrial || isTrialBlock);

  const handleUpgrade = () => {
    dismissMessageLimit();
    router.push('/settings/billing');
  };

  // Determine header text
  const headerTitle = isTrialBlock
    ? 'Free Trial Ended'
    : blockedBy === 'weekly'
    ? 'Weekly Limit Reached'
    : 'Session Limit Reached';

  const headerSubtitle = isTrialBlock
    ? 'Your 3-day free trial has expired. Subscribe to continue using Flowbooks.'
    : blockedBy === 'weekly'
    ? 'You\'ve reached your weekly usage limit'
    : 'You\'ve reached your session usage limit';

  return (
    <Modal open={messageLimitReached} onClose={dismissMessageLimit}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: { xs: '95vw', sm: 520 },
          width: '100%',
          borderRadius: 'lg',
          p: 0,
          overflow: 'hidden',
        }}
      >
        <ModalClose sx={{ zIndex: 2 }} />

        {/* Header */}
        <Box sx={{ p: 3, bgcolor: isTrialBlock ? 'danger.softBg' : 'warning.softBg', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 44, height: 44, borderRadius: 'md',
              bgcolor: isTrialBlock ? 'danger.softHoverBg' : 'warning.softHoverBg', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {isTrialBlock
                ? <Clock size={22} style={{ color: 'var(--joy-palette-danger-600)' }} />
                : <AlertTriangle size={22} style={{ color: 'var(--joy-palette-warning-600)' }} />
              }
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>
                {headerTitle}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {headerSubtitle}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Usage Stats - hide for trial expired */}
            {!isTrialBlock && (
              <Box sx={{ p: 2, borderRadius: 'md', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography level="body-sm" fontWeight={600}>Session</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{sessionTimeLeft ? `Resets in ${sessionTimeLeft}` : 'New session'}</Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'neutral.200', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: '100%', borderRadius: 3, bgcolor: blockedBy === 'session' ? '#ef4444' : '#D97757', transition: 'width 0.3s ease' }} />
                    </Box>
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography level="body-sm" fontWeight={600}>This Week</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Resets Monday</Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'neutral.200', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: blockedBy === 'weekly' ? '100%' : `${Math.min(100, Math.round((usage?.weeklyTokensUsed || 0) / (plan.weeklyTokenLimit || 1) * 100))}%`, borderRadius: 3, bgcolor: blockedBy === 'weekly' ? '#ef4444' : '#D97757', transition: 'width 0.3s ease' }} />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Upgrade Section */}
            {canUpgrade && nextPlan && (
              <>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Crown size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>
                      {isTrialBlock ? `Subscribe to ${nextPlan.name}` : `Upgrade to ${nextPlan.name}`}
                    </Typography>
                    <Chip size="sm" variant="soft" color="primary">${nextPlan.price}/mo</Chip>
                  </Stack>
                  <Stack spacing={0.75}>
                    {features.map((feature, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <Check size={14} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                        <Typography level="body-sm">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Button
                  variant="solid"
                  color="primary"
                  size="lg"
                  endDecorator={<ArrowRight size={16} />}
                  onClick={handleUpgrade}
                  fullWidth
                >
                  {isTrialBlock ? 'Subscribe Now' : `Upgrade to ${nextPlan.name}`}
                </Button>
              </>
            )}

            {/* Max plan user - no upgrade available */}
            {!canUpgrade && (
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {blockedBy === 'weekly'
                  ? 'Your weekly usage will reset on Monday.'
                  : `Your session will reset in ${sessionTimeLeft || 'a few hours'}.`}
              </Typography>
            )}

            {/* Footer Actions */}
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button variant="plain" color="neutral" onClick={dismissMessageLimit}>
                Maybe Later
              </Button>
              {canUpgrade && (
                <Button variant="outlined" color="neutral" onClick={handleUpgrade}>
                  View All Plans
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
