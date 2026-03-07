'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button, Card, CardContent, Chip, Divider,
} from '@mui/joy';
import { Sparkles, Check, Clock, ArrowRight, X } from 'lucide-react';
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

    // Check if already shown
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
          maxWidth: 540,
          width: '100%',
          p: 0,
          overflow: 'hidden',
          borderRadius: 'xl',
          bgcolor: isDark ? 'background.surface' : 'background.body',
          border: '1px solid',
          borderColor: isDark ? 'neutral.700' : 'neutral.200',
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
          p: 3, pb: 2.5,
          background: 'linear-gradient(135deg, #D97757 0%, #E8956F 50%, #F0B090 100%)',
          textAlign: 'center',
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <Sparkles size={26} color="white" />
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 700 }}>
            Welcome to Flowbooks!
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
            You have a {TRIAL_DURATION_DAYS}-day free trial of the Pro plan
          </Typography>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {/* Trial Info */}
          <Box sx={{
            p: 2, borderRadius: 'md', bgcolor: 'primary.softBg',
            border: '1px solid', borderColor: 'primary.200',
            mb: 2,
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Clock size={18} style={{ color: 'var(--joy-palette-primary-600)', flexShrink: 0 }} />
              <Box>
                <Typography level="title-sm" fontWeight={700} sx={{ color: 'primary.700' }}>
                  {trialTimeLeft ? `${trialTimeLeft} remaining` : `${TRIAL_DURATION_DAYS} days remaining`}
                </Typography>
                <Typography level="body-xs" sx={{ color: 'primary.600' }}>
                  Full Pro features included. No credit card required.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* What's included */}
          <Typography level="title-sm" fontWeight={700} sx={{ mb: 1 }}>
            What's included in your trial
          </Typography>
          <Stack spacing={0.75} sx={{ mb: 2 }}>
            {[
              `${formatMessages(pro.sessionMessageLimit)} AI messages per session`,
              `${formatMessages(pro.weeklyMessageLimit)} messages per week`,
              `Up to ${pro.maxCompanies} companies`,
              'Unlimited customers & vendors',
              'All financial reports & exports',
              'Payroll & salary slips',
            ].map((feature, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Check size={14} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                <Typography level="body-sm">{feature}</Typography>
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* After trial pricing */}
          <Typography level="title-sm" fontWeight={700} sx={{ mb: 1.5 }}>
            After your trial
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
            <Card variant="outlined" sx={{ flex: 1, borderColor: 'primary.300', borderWidth: 2 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                <Chip size="sm" variant="soft" color="primary" sx={{ mb: 0.5 }}>Popular</Chip>
                <Typography level="body-sm" fontWeight={700}>Pro</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography level="title-lg" fontWeight={700}>${pro.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {formatMessages(pro.sessionMessageLimit)} msgs/session
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                <Chip size="sm" variant="soft" color="success" sx={{ mb: 0.5 }}>Best Value</Chip>
                <Typography level="body-sm" fontWeight={700}>Max</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
                  <Typography level="title-lg" fontWeight={700}>${max.price}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {formatMessages(max.sessionMessageLimit)} msgs/session
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Actions */}
          <Button
            variant="solid"
            color="primary"
            fullWidth
            size="lg"
            endDecorator={<ArrowRight size={16} />}
            onClick={() => setOpen(false)}
          >
            Start Exploring
          </Button>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 1 }}>
            You can subscribe anytime from your account settings
          </Typography>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
