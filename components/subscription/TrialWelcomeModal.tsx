'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button, Card, CardContent, Chip, Divider,
} from '@mui/joy';
import { Sparkles, Check, Clock, ArrowRight, X, Zap, Crown, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, formatMessages, TRIAL_DURATION_DAYS } from '@/lib/plans';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TrialWelcomeModal() {
  const { user } = useAuth();
  const { isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const { mode } = useColorScheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid || !isTrial || trialExpired) return;

    const ref = doc(db, 'users', user.uid, 'settings', 'trialWelcome');
    getDoc(ref).then(snap => {
      if (!snap.exists() || !snap.data()?.shown) {
        setOpen(true);
        setDoc(ref, { shown: true, shownAt: new Date() }, { merge: true }).catch(() => {});
      }
    }).catch(() => {});
  }, [user?.uid, isTrial, trialExpired]);

  if (!open) return null;

  const isDark = mode === 'dark';
  const pro = PLANS.pro;
  const max = PLANS.max;

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog
        sx={{
          maxWidth: 480,
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
        {/* Close */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          <Button size="sm" variant="plain" onClick={() => setOpen(false)}
            sx={{ minWidth: 0, p: 0.5, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <X size={18} />
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{
          p: 3.5, pb: 3,
          background: isDark
            ? 'linear-gradient(135deg, #9a4a2a 0%, #D97757 100%)'
            : 'linear-gradient(135deg, #D97757 0%, #E8956F 50%, #F0B090 100%)',
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
            <Sparkles size={28} color="white" />
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome to Flowbooks
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, fontWeight: 500 }}>
            Your {TRIAL_DURATION_DAYS}-day Pro trial is active
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Trial Timer */}
          <Box sx={{
            p: 1.5, borderRadius: 'lg',
            bgcolor: isDark ? 'primary.900' : 'primary.50',
            border: '1px solid',
            borderColor: isDark ? 'primary.700' : 'primary.200',
            mb: 2.5,
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md',
                bgcolor: isDark ? 'primary.800' : 'primary.100',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Clock size={18} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Box>
                <Typography level="title-sm" fontWeight={700}>
                  {trialTimeLeft || `${TRIAL_DURATION_DAYS} days`} remaining
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Full access to all Pro features. No credit card needed.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Included Features */}
          <Typography level="body-xs" sx={{
            color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700,
            letterSpacing: '0.06em', mb: 1.5,
          }}>
            Included in your trial
          </Typography>
          <Stack spacing={1} sx={{ mb: 2.5 }}>
            <FeatureRow icon={<Zap size={14} />} text={`${formatMessages(pro.sessionMessageLimit)} AI messages per session`} />
            <FeatureRow icon={<Zap size={14} />} text={`${formatMessages(pro.weeklyMessageLimit)} messages per week`} />
            <FeatureRow icon={<Crown size={14} />} text={`Up to ${pro.maxCompanies} companies`} />
            <FeatureRow icon={<Shield size={14} />} text="Unlimited customers & vendors" />
            <FeatureRow icon={<Shield size={14} />} text="All reports, exports & payroll" />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Pricing After Trial */}
          <Typography level="body-xs" sx={{
            color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700,
            letterSpacing: '0.06em', mb: 1.5,
          }}>
            Plans after trial
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <PlanCard
              name="Pro"
              price={pro.price}
              detail={`${formatMessages(pro.sessionMessageLimit)} msgs/session`}
              badge="Most Popular"
              badgeColor="primary"
              highlighted
              isDark={isDark}
            />
            <PlanCard
              name="Max"
              price={max.price}
              detail={`${formatMessages(max.sessionMessageLimit)} msgs/session`}
              badge="Best Value"
              badgeColor="success"
              isDark={isDark}
            />
          </Stack>

          {/* CTA */}
          <Button
            variant="solid"
            color="primary"
            fullWidth
            size="lg"
            endDecorator={<ArrowRight size={16} />}
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 'lg', fontWeight: 700 }}
          >
            Get Started
          </Button>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 1.5 }}>
            Subscribe anytime from Account Settings
          </Typography>
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

function PlanCard({ name, price, detail, badge, badgeColor, highlighted, isDark }: {
  name: string;
  price: number;
  detail: string;
  badge: string;
  badgeColor: 'primary' | 'success';
  highlighted?: boolean;
  isDark: boolean;
}) {
  return (
    <Card variant="outlined" sx={{
      flex: 1,
      borderColor: highlighted ? `${badgeColor}.400` : isDark ? 'neutral.700' : 'neutral.200',
      borderWidth: highlighted ? 2 : 1,
      position: 'relative',
      overflow: 'visible',
    }}>
      {highlighted && (
        <Chip size="sm" variant="solid" color={badgeColor} sx={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
        }}>
          {badge.toUpperCase()}
        </Chip>
      )}
      <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography level="body-sm" fontWeight={700} sx={{ mb: 0.25 }}>{name}</Typography>
        <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
          <Typography level="title-lg" fontWeight={800}>${price}</Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
        </Stack>
        <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );
}
