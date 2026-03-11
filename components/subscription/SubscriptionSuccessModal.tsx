'use client';

import { useEffect, useState } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button, Chip, Divider,
  CircularProgress,
} from '@mui/joy';
import { CheckCircle, Crown, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, formatMessages } from '@/lib/plans';

export default function SubscriptionSuccessModal() {
  const { plan, subscription, isPaidSubscriber } = useSubscription();
  const { subscriptionSuccess, dismissSubscriptionSuccess, openSettings } = useSettingsModal();
  const { mode } = useColorScheme();
  const [waitingForWebhook, setWaitingForWebhook] = useState(true);

  // Wait for the webhook to process and subscription to become active
  useEffect(() => {
    if (!subscriptionSuccess) {
      setWaitingForWebhook(true);
      return;
    }
    if (isPaidSubscriber) {
      setWaitingForWebhook(false);
    } else {
      // Give webhook up to 30s to process
      const timeout = setTimeout(() => setWaitingForWebhook(false), 30000);
      return () => clearTimeout(timeout);
    }
  }, [subscriptionSuccess, isPaidSubscriber]);

  if (!subscriptionSuccess) return null;

  const isDark = mode === 'dark';

  // Use real plan data if available, otherwise show Pro as default
  const activePlan = isPaidSubscriber ? plan : PLANS.pro;
  const planName = activePlan.name;

  const handleViewPlan = () => {
    dismissSubscriptionSuccess();
    openSettings('subscription');
  };

  return (
    <Modal open={subscriptionSuccess} onClose={dismissSubscriptionSuccess}>
      <ModalDialog
        sx={{
          maxWidth: 440,
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'xl',
          bgcolor: isDark ? 'background.surface' : 'background.body',
          border: '1px solid',
          borderColor: isDark ? 'neutral.700' : 'neutral.200',
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.5)'
            : '0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 3.5, pb: 3,
          background: isDark
            ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <Box sx={{
            width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 2,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            {waitingForWebhook
              ? <CircularProgress size="sm" sx={{ '--CircularProgress-trackColor': 'rgba(255,255,255,0.2)', '--CircularProgress-progressColor': 'white' }} />
              : <CheckCircle size={32} color="white" />
            }
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {waitingForWebhook ? 'Activating...' : `You're on ${planName}`}
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, fontWeight: 500 }}>
            {waitingForWebhook
              ? 'Setting up your subscription, just a moment...'
              : 'Your subscription is active. Time to build.'}
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {waitingForWebhook ? (
            <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size="lg" />
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Processing your payment...
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {/* Plan Summary */}
              <Box sx={{
                p: 2, borderRadius: 'lg',
                bgcolor: isDark ? 'neutral.800' : 'neutral.50',
                border: '1px solid',
                borderColor: isDark ? 'neutral.700' : 'neutral.200',
              }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Crown size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
                      <Typography level="title-sm" fontWeight={700}>{planName} Plan</Typography>
                    </Stack>
                    <Chip size="sm" variant="solid" color="success" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      ACTIVE
                    </Chip>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Billing</Typography>
                    <Typography level="body-sm" fontWeight={600}>${activePlan.price}/month</Typography>
                  </Stack>

                  {subscription?.currentPeriodEnd && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Renews</Typography>
                      <Typography level="body-sm" fontWeight={600}>
                        {(subscription.currentPeriodEnd as any)?.toDate
                          ? new Date((subscription.currentPeriodEnd as any).toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : '-'}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* What You Get */}
              <Box>
                <Typography level="body-xs" sx={{
                  color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700,
                  letterSpacing: '0.06em', mb: 1.5,
                }}>
                  What's included
                </Typography>
                <Stack spacing={1}>
                  <FeatureRow icon={<Zap size={14} />} text={activePlan.id === 'max' ? '3x more AI usage + advanced models' : 'Extended AI usage per session (4h)'} />
                  <FeatureRow icon={<Crown size={14} />} text={`Up to ${activePlan.maxCompanies} companies`} />
                  <FeatureRow icon={<Users size={14} />} text={activePlan.maxCollaboratorsPerCompany === -1 ? 'Unlimited team members' : `${activePlan.maxCollaboratorsPerCompany} team members per company`} />
                  <FeatureRow icon={<Shield size={14} />} text={activePlan.id === 'max' ? 'Unlimited everything + priority support' : 'All reports, payroll & exports'} />
                </Stack>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={dismissSubscriptionSuccess}
                  sx={{ flex: 1, borderRadius: 'lg' }}
                >
                  Close
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  endDecorator={<ArrowRight size={16} />}
                  onClick={handleViewPlan}
                  sx={{ flex: 2, borderRadius: 'lg' }}
                >
                  Manage Subscription
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </ModalDialog>
    </Modal>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: 'success.500', flexShrink: 0, display: 'flex' }}>{icon}</Box>
      <Typography level="body-sm">{text}</Typography>
    </Stack>
  );
}
