'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, Chip, Card, CardContent,
} from '@mui/joy';
import { Crown, Check, ArrowRight, X, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, formatMessages } from '@/lib/plans';

export default function PremiumModal() {
  const { user } = useAuth();
  const { plan, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const { openSettings } = useSettingsModal();
  const { mode } = useColorScheme();
  const [open, setOpen] = useState(false);

  // Show modal when trial expires
  useEffect(() => {
    if (!user?.uid) return;
    if (trialExpired) {
      // Show once per session
      if (typeof window !== 'undefined' && !sessionStorage.getItem('trial_expired_modal_shown')) {
        setOpen(true);
        sessionStorage.setItem('trial_expired_modal_shown', 'true');
      }
    }
  }, [user?.uid, trialExpired]);

  const handleDismiss = () => {
    setOpen(false);
  };

  const handleUpgrade = () => {
    setOpen(false);
    openSettings('subscription');
  };

  if (!open) return null;

  const isDark = mode === 'dark';
  const pro = PLANS.pro;
  const max = PLANS.max;

  return (
    <Modal open={open} onClose={handleDismiss}>
      <ModalDialog
        sx={{
          maxWidth: 520,
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'xl',
          bgcolor: isDark ? 'background.surface' : 'background.body',
          border: '1px solid',
          borderColor: isDark ? 'neutral.700' : 'neutral.200',
        }}
      >
        {/* Close button */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          <Button size="sm" variant="plain" onClick={handleDismiss} sx={{ minWidth: 0, p: 0.5, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <X size={18} />
          </Button>
        </Box>

        {/* Gradient Header */}
        <Box sx={{
          p: 3,
          pb: 2.5,
          background: 'linear-gradient(135deg, #DC2626 0%, #D97757 50%, #E8956F 100%)',
          textAlign: 'center',
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <Clock size={26} color="white" />
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 700 }}>
            Your Free Trial Has Ended
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
            Subscribe to continue using Flowbooks with all its features
          </Typography>
        </Box>

        {/* Plan Cards */}
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: 'primary.400',
                borderWidth: 2,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <Chip
                size="sm"
                variant="solid"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                POPULAR
              </Chip>
              <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography level="body-sm" fontWeight={700} sx={{ mb: 0.5 }}>Pro</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography level="title-lg" fontWeight={700}>${pro.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
                  {formatMessages(pro.sessionMessageLimit)} msgs/session · {formatMessages(pro.weeklyMessageLimit)}/week
                </Typography>
                <Stack spacing={0.5} alignItems="flex-start">
                  {['3 companies', 'Unlimited clients', 'All reports', 'Payroll'].map((f, i) => (
                    <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                      <Check size={12} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                      <Typography level="body-xs" sx={{ textAlign: 'left' }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography level="body-sm" fontWeight={700} sx={{ mb: 0.5 }}>Max</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography level="title-lg" fontWeight={700}>${max.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
                  {formatMessages(max.sessionMessageLimit)} msgs/session · {formatMessages(max.weeklyMessageLimit)}/week
                </Typography>
                <Stack spacing={0.5} alignItems="flex-start">
                  {['10 companies', 'Advanced AI', 'Unlimited all', 'Priority support'].map((f, i) => (
                    <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                      <Check size={12} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                      <Typography level="body-xs" sx={{ textAlign: 'left' }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="plain"
              color="neutral"
              onClick={handleDismiss}
              sx={{ flex: 1 }}
            >
              Maybe Later
            </Button>
            <Button
              variant="solid"
              color="primary"
              endDecorator={<ArrowRight size={16} />}
              onClick={handleUpgrade}
              sx={{ flex: 2 }}
            >
              Subscribe Now
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
