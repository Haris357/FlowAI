'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, Chip,
} from '@mui/joy';
import { Crown, Check, ArrowRight, X, Lock, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@mui/joy/styles';
import { useRouter } from 'next/navigation';
import { PLANS, formatMessages } from '@/lib/plans';

export default function PremiumModal() {
  const { user } = useAuth();
  const { isTrial, isTrialExpired: trialExpired } = useSubscription();
  const router = useRouter();
  const { mode } = useColorScheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    if (trialExpired) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('trial_expired_modal_shown')) {
        setOpen(true);
        sessionStorage.setItem('trial_expired_modal_shown', 'true');
      }
    }
  }, [user?.uid, trialExpired]);

  const handleUpgrade = () => {
    setOpen(false);
    router.push('/settings/billing');
  };

  if (!open) return null;

  const isDark = mode === 'dark';
  const pro = PLANS.pro;
  const max = PLANS.max;

  const proFeatures = [
    'Extended AI usage (4h sessions)',
    `Up to ${pro.maxCompanies} companies`,
    'Unlimited customers & vendors',
    'All reports, payroll & exports',
  ];

  const maxFeatures = [
    '3x AI + advanced models',
    `Up to ${max.maxCompanies} companies`,
    'Unlimited team members & emails',
    'Priority support (24h)',
  ];

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog
        sx={{
          maxWidth: { xs: '95vw', sm: 480 },
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          bgcolor: isDark ? 'neutral.900' : '#fff',
          border: '1px solid',
          borderColor: isDark ? 'neutral.700' : 'neutral.200',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <Box sx={{
          position: 'relative',
          px: 3, pt: 4, pb: 3,
          background: 'linear-gradient(135deg, #B91C1C 0%, #D97757 100%)',
          textAlign: 'center',
        }}>
          <Button
            size="sm" variant="plain"
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute', top: 10, right: 10,
              minWidth: 0, p: 0.5, color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <X size={18} />
          </Button>

          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 8px rgba(255,255,255,0.08)',
          }}>
            <Lock size={26} color="white" />
          </Box>

          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.2 }}>
            Your Trial Has Ended
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.75, fontSize: '0.875rem' }}>
            Subscribe to continue using Flowbooks
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          {/* Plan Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            {/* Pro */}
            <Box sx={{
              flex: 1, p: 2, borderRadius: '12px',
              border: '2px solid', borderColor: '#D97757',
              bgcolor: isDark ? 'rgba(217,119,87,0.08)' : '#FFF8F5',
              position: 'relative',
            }}>
              <Chip size="sm" sx={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                bgcolor: '#D97757', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
              }}>
                POPULAR
              </Chip>
              <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                <Typography level="body-sm" fontWeight={700}>Pro</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3 }}>${pro.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
              </Box>
              <Stack spacing={0.75}>
                {proFeatures.map((f, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Check size={12} color="#D97757" style={{ flexShrink: 0 }} />
                    <Typography level="body-xs">{f}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Max */}
            <Box sx={{
              flex: 1, p: 2, borderRadius: '12px',
              border: '1px solid',
              borderColor: isDark ? 'neutral.700' : 'neutral.200',
            }}>
              <Box sx={{ textAlign: 'center', mb: 1.5, mt: 0.5 }}>
                <Typography level="body-sm" fontWeight={700}>Max</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3 }}>${max.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
              </Box>
              <Stack spacing={0.75}>
                {maxFeatures.map((f, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Check size={12} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                    <Typography level="body-xs">{f}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>

          {/* Actions */}
          <Button
            fullWidth
            size="lg"
            endDecorator={<ArrowRight size={16} />}
            onClick={handleUpgrade}
            sx={{
              borderRadius: '10px', fontWeight: 700, py: 1.25, mb: 1,
              background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #C4694D 0%, #B85A3D 100%)' },
            }}
          >
            Subscribe Now
          </Button>
          <Button
            fullWidth
            variant="plain"
            color="neutral"
            size="sm"
            onClick={() => setOpen(false)}
            sx={{ fontWeight: 500 }}
          >
            Maybe Later
          </Button>

          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 1.5 }}>
            Your data is safe and waiting for you
          </Typography>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
