'use client';
import { Modal, ModalDialog, ModalClose, Typography, Box, Stack, Button, Chip, Divider } from '@mui/joy';
import { Zap, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLANS, getPlan } from '@/lib/plans';

export default function UpgradeModal() {
  const { upgradeReason, dismissUpgradeModal, plan } = useSubscription();
  const router = useRouter();

  if (!upgradeReason) return null;

  const nextPlan = plan.id === 'free' ? PLANS.pro : plan.id === 'pro' ? PLANS.max : null;

  return (
    <Modal open={!!upgradeReason} onClose={dismissUpgradeModal}>
      <ModalDialog variant="outlined" sx={{ maxWidth: 440, width: '100%', borderRadius: 'lg', p: 3 }}>
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
              <Typography level="title-lg" fontWeight={700}>Upgrade Required</Typography>
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

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="plain" color="neutral" onClick={dismissUpgradeModal}>
              Maybe Later
            </Button>
            <Button
              variant="solid"
              color="primary"
              endDecorator={<ArrowRight size={16} />}
              onClick={() => {
                dismissUpgradeModal();
                router.push('/settings/billing');
              }}
            >
              View Plans
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
      `${(next.tokenAllocation / 1000).toFixed(0)}K AI tokens/month`,
      'Unlimited customers & vendors',
      'All financial reports',
      'Payroll & salary slips',
      `Up to ${next.maxCompanies} companies`,
      'Email support',
    ];
  }
  if (currentPlanId === 'pro') {
    return [
      `${(next.tokenAllocation / 1000000).toFixed(0)}M AI tokens/month`,
      'Advanced AI capabilities',
      'Up to 10 companies',
      'Unlimited collaborators',
      'Unlimited everything',
      'Priority support (24h)',
    ];
  }
  return [];
}
