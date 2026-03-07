'use client';

import {
  Modal, ModalDialog, Typography, Box, Stack, Button, Chip, Divider,
} from '@mui/joy';
import { CheckCircle, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { useColorScheme } from '@mui/joy/styles';
import { formatMessages } from '@/lib/plans';

export default function SubscriptionSuccessModal() {
  const { plan, subscription, isTrial, trialTimeLeft } = useSubscription();
  const { subscriptionSuccess, dismissSubscriptionSuccess, openSettings } = useSettingsModal();
  const { mode } = useColorScheme();

  if (!subscriptionSuccess) return null;

  const isDark = mode === 'dark';
  const isActive = subscription?.status === 'active';
  const planName = plan.name;

  const handleViewPlan = () => {
    dismissSubscriptionSuccess();
    openSettings('subscription');
  };

  return (
    <Modal open={subscriptionSuccess} onClose={dismissSubscriptionSuccess}>
      <ModalDialog
        sx={{
          maxWidth: 460,
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'xl',
          bgcolor: isDark ? 'background.surface' : 'background.body',
          border: '1px solid',
          borderColor: isDark ? 'neutral.700' : 'neutral.200',
        }}
      >
        {/* Success Header */}
        <Box sx={{
          p: 3,
          pb: 2.5,
          background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
          textAlign: 'center',
        }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <CheckCircle size={30} color="white" />
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 700 }}>
            Welcome to {planName}!
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
            Your subscription is now active
          </Typography>
        </Box>

        {/* Plan Details */}
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {/* Status Card */}
            <Box sx={{
              p: 2, borderRadius: 'md', bgcolor: 'background.level1',
              border: '1px solid', borderColor: 'divider',
            }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Crown size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>Plan</Typography>
                  </Stack>
                  <Chip size="sm" variant="soft" color="success" sx={{ fontWeight: 700 }}>
                    {planName}
                  </Chip>
                </Stack>

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Status</Typography>
                  <Chip size="sm" variant="soft" color="success">
                    {isActive ? 'Active' : subscription?.status || 'Active'}
                  </Chip>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Price</Typography>
                  <Typography level="body-sm" fontWeight={600}>${plan.price}/month</Typography>
                </Stack>

                {subscription?.currentPeriodEnd && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Next billing</Typography>
                    <Typography level="body-sm" fontWeight={600}>
                      {(subscription.currentPeriodEnd as any)?.toDate
                        ? new Date((subscription.currentPeriodEnd as any).toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '-'}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Features Unlocked */}
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
                <Sparkles size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="title-sm" fontWeight={700}>Features Unlocked</Typography>
              </Stack>
              <Stack spacing={0.75}>
                {[
                  `${formatMessages(plan.sessionMessageLimit)} AI messages/session`,
                  `${formatMessages(plan.weeklyMessageLimit)} messages/week`,
                  `Up to ${plan.maxCompanies} companies`,
                  plan.maxCollaboratorsPerCompany === -1 ? 'Unlimited collaborators' : `${plan.maxCollaboratorsPerCompany} collaborators/company`,
                  'All financial reports & exports',
                  plan.features.payroll ? 'Payroll & salary slips' : null,
                ].filter(Boolean).map((feature, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <CheckCircle size={14} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                    <Typography level="body-sm">{feature}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="plain"
                color="neutral"
                onClick={dismissSubscriptionSuccess}
                sx={{ flex: 1 }}
              >
                Got it
              </Button>
              <Button
                variant="solid"
                color="primary"
                endDecorator={<ArrowRight size={16} />}
                onClick={handleViewPlan}
                sx={{ flex: 2 }}
              >
                View Subscription
              </Button>
            </Stack>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
