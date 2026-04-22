'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, Chip,
} from '@mui/joy';
import { Check, ArrowRight, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@mui/joy/styles';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/plans';

export default function PremiumModal() {
  const { user } = useAuth();
  const { isTrialExpired: trialExpired } = useSubscription();
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
    'Extended AI usage',
    `Up to ${pro.maxCompanies} companies`,
    'Unlimited customers & vendors',
    'All reports & exports',
  ];

  const maxFeatures = [
    '3x AI + advanced models',
    `Up to ${max.maxCompanies} companies`,
    'Unlimited team members',
    'Priority support',
  ];

  const textPrimary = isDark ? '#EEECE8' : '#1A1915';
  const textSecondary = isDark ? '#A8A29E' : '#78736D';
  const textMuted = isDark ? '#5C5752' : '#A8A29E';
  const softBrandBg = isDark ? 'rgba(217,119,87,0.1)' : '#FFF8F5';
  const borderSoft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const neutralSoftBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog
        sx={{
          maxWidth: { xs: '95vw', sm: 460 },
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: '20px',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid',
          borderColor: borderSoft,
          boxShadow: isDark
            ? '0 32px 64px rgba(0,0,0,0.5)'
            : '0 32px 64px rgba(0,0,0,0.12)',
        }}
      >
        {/* Close button */}
        <Button
          size="sm"
          variant="plain"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            minWidth: 0, p: 0.5, borderRadius: '50%',
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
            '&:hover': {
              color: isDark ? '#EEECE8' : '#1A1915',
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          }}
        >
          <X size={16} />
        </Button>

        {/* Header */}
        <Box sx={{ px: 3, pt: 3.25, pb: 2.25 }}>
          <Stack direction="row" spacing={1.75} alignItems="flex-start">
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(217,119,87,0.3)',
            }}>
              <Lock size={20} color="white" />
            </Box>
            <Box sx={{ pt: 0.25, pr: 3 }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.25,
                color: textPrimary,
              }}>
                Your trial has ended
              </Typography>
              <Typography sx={{
                fontSize: '0.82rem', color: textSecondary, mt: 0.35, lineHeight: 1.45,
              }}>
                Pick a plan to keep using Flowbooks — your data is safe.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Plan cards */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            {/* Pro */}
            <Box sx={{
              flex: 1, p: 1.75, borderRadius: '12px', position: 'relative',
              border: '1.5px solid #D97757',
              bgcolor: softBrandBg,
            }}>
              <Chip size="sm" sx={{
                position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                bgcolor: '#D97757', color: '#fff',
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
                '--Chip-minHeight': '18px', px: 0.875,
              }}>
                POPULAR
              </Chip>
              <Stack direction="row" alignItems="baseline" sx={{ mb: 1.25, mt: 0.25 }}>
                <Typography sx={{
                  fontWeight: 700, fontSize: '0.88rem', color: textPrimary, flex: 1,
                }}>
                  Pro
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.15}>
                  <Typography sx={{
                    fontWeight: 800, fontSize: '1.05rem', color: textPrimary,
                    letterSpacing: '-0.01em',
                  }}>
                    ${pro.price}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: textSecondary }}>
                    /mo
                  </Typography>
                </Stack>
              </Stack>
              <Stack spacing={0.625}>
                {proFeatures.map((f, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{
                      width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                      bgcolor: isDark ? 'rgba(217,119,87,0.2)' : 'rgba(217,119,87,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color="#D97757" strokeWidth={3} />
                    </Box>
                    <Typography sx={{
                      fontSize: '0.76rem', color: textPrimary, lineHeight: 1.35,
                    }}>
                      {f}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Max */}
            <Box sx={{
              flex: 1, p: 1.75, borderRadius: '12px',
              border: '1px solid', borderColor: borderSoft,
            }}>
              <Stack direction="row" alignItems="baseline" sx={{ mb: 1.25, mt: 0.25 }}>
                <Typography sx={{
                  fontWeight: 700, fontSize: '0.88rem', color: textPrimary, flex: 1,
                }}>
                  Max
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.15}>
                  <Typography sx={{
                    fontWeight: 800, fontSize: '1.05rem', color: textPrimary,
                    letterSpacing: '-0.01em',
                  }}>
                    ${max.price}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: textSecondary }}>
                    /mo
                  </Typography>
                </Stack>
              </Stack>
              <Stack spacing={0.625}>
                {maxFeatures.map((f, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{
                      width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                      bgcolor: neutralSoftBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color={textSecondary} strokeWidth={3} />
                    </Box>
                    <Typography sx={{
                      fontSize: '0.76rem', color: textPrimary, lineHeight: 1.35,
                    }}>
                      {f}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Actions */}
        <Box sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="plain"
              onClick={() => setOpen(false)}
              sx={{
                flex: 1, borderRadius: '10px',
                fontWeight: 600, fontSize: '0.82rem',
                color: textSecondary,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: textPrimary,
                },
              }}
            >
              Maybe later
            </Button>
            <Button
              endDecorator={<ArrowRight size={15} />}
              onClick={handleUpgrade}
              sx={{
                flex: 1.5, borderRadius: '10px',
                fontWeight: 700, fontSize: '0.82rem',
                bgcolor: '#D97757',
                '&:hover': { bgcolor: '#C4694D' },
              }}
            >
              Subscribe now
            </Button>
          </Stack>
          <Typography sx={{
            fontSize: '0.68rem', color: textMuted,
            textAlign: 'center', mt: 1.25,
          }}>
            Your data is safe and waiting for you
          </Typography>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
