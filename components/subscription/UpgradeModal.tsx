'use client';
import { Modal, ModalDialog, ModalClose, Typography, Box, Stack, Button, Chip, Divider } from '@mui/joy';
import { Zap, ArrowRight, Check } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { PLANS, getPlan } from '@/lib/plans';

export default function UpgradeModal() {
  const { upgradeReason, dismissUpgradeModal, plan, isTrial, isTrialExpired: trialExpired } = useSubscription();
  const { openSettings } = useSettingsModal();

  if (!upgradeReason) return null;

  const isTrialContext = isTrial || trialExpired;
  const nextPlan = (plan.id === 'free' || isTrialContext) ? PLANS.pro : plan.id === 'pro' ? PLANS.max : null;

  return (
    <Modal open={!!upgradeReason} onClose={dismissUpgradeModal}>
      <ModalDialog variant="outlined" sx={{ maxWidth: { xs: '95vw', sm: 440 }, width: '100%', borderRadius: 'lg', p: 3 }}>
        <ModalClose />
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 40, height: 40, borderRadius: 'md',
              bgcolor: 'warning.softBg', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} style={{ color: 'var(--joy-palette-warning-600)' }} />
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>{trialExpired ? 'Trial Expired' : 'Upgrade Required'}</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{upgradeReason}</Typography>
            </Box>
          </Stack>

          {nextPlan && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography level="title-sm" fontWeight={700}>
                    {nextPlan.name} Plan
                  </Typography>
                  <Chip size="sm" variant="soft" color="primary">
                    ${nextPlan.price}/mo
                  </Chip>
                </Stack>

                <Stack spacing={1}>
                  {getUpgradeHighlights(plan.id, nextPlan.id).map((highlight, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Check size={14} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                      <Typography level="body-sm">{highlight}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </>
          )}

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
            <Button variant="plain" color="neutral" onClick={dismissUpgradeModal}>
              Maybe Later
            </Button>
            <Button
              variant="solid"
              color="primary"
              endDecorator={<ArrowRight size={16} />}
              onClick={() => {
                dismissUpgradeModal();
                openSettings('subscription');
              }}
            >
              {trialExpired ? 'Subscribe Now' : 'View Plans'}
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

function getUpgradeHighlights(currentPlanId: string, nextPlanId: string): string[] {
  const next = getPlan(nextPlanId as any);

  if (currentPlanId === 'free') {
    return [
      'Extended AI usage per session',
      'Unlimited customers & vendors',
      'All financial reports & exports',
      'Payroll & salary slips',
      `Up to ${next.maxCompanies} companies`,
    ];
  }
  if (currentPlanId === 'pro') {
    return [
      '3x more AI usage per session',
      'Advanced AI models',
      'Up to 10 companies',
      'Unlimited team members',
      'Unlimited email sends & chat history',
      'Priority support (24h)',
    ];
  }
  return [];
}
