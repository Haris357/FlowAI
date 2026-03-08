'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button,
} from '@mui/joy';
import { Sparkles, Clock, ArrowRight, X, Zap, Building2, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, TRIAL_DURATION_DAYS } from '@/lib/plans';
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

  const features = [
    { icon: Zap, label: 'AI-Powered Accounting', desc: `${pro.sessionMessageLimit} messages per session` },
    { icon: Building2, label: 'Company Management', desc: `Up to ${pro.maxCompanies} companies` },
    { icon: FileText, label: 'Invoicing & Billing', desc: 'Unlimited invoices & clients' },
    { icon: BarChart3, label: 'Reports & Exports', desc: 'All reports, PDF & Excel' },
  ];

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog
        sx={{
          maxWidth: 440,
          width: '95%',
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
          background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
          textAlign: 'center',
        }}>
          {/* Close */}
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
            <Sparkles size={26} color="white" />
          </Box>

          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.2 }}>
            Welcome to Flowbooks!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.75, fontSize: '0.875rem' }}>
            Your {TRIAL_DURATION_DAYS}-day Pro trial is now active
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          {/* Timer chip */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            p: 1.25, mb: 2.5, borderRadius: '10px',
            bgcolor: isDark ? 'rgba(217,119,87,0.12)' : '#FFF5F0',
            border: '1px solid',
            borderColor: isDark ? 'rgba(217,119,87,0.25)' : '#FFE0D0',
          }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
              bgcolor: isDark ? 'rgba(217,119,87,0.2)' : '#FFD6C4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={16} color="#D97757" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-sm" fontWeight={700} sx={{ color: '#D97757', lineHeight: 1.2 }}>
                {trialTimeLeft || `${TRIAL_DURATION_DAYS} days`} remaining
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                No credit card required
              </Typography>
            </Box>
          </Box>

          {/* Features */}
          <Typography level="body-xs" sx={{
            color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700,
            letterSpacing: '0.06em', mb: 1.5,
          }}>
            Everything included
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 2.5 }}>
            {features.map((f, i) => (
              <Stack key={i} direction="row" spacing={1.25} alignItems="center" sx={{
                p: 1.25, borderRadius: '10px',
                bgcolor: isDark ? 'neutral.800' : 'neutral.50',
                border: '1px solid',
                borderColor: isDark ? 'neutral.700' : 'neutral.100',
              }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                  bgcolor: isDark ? 'rgba(217,119,87,0.15)' : '#FFF0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={16} color="#D97757" />
                </Box>
                <Box>
                  <Typography level="body-sm" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {f.label}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {f.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* CTA */}
          <Button
            fullWidth
            size="lg"
            endDecorator={<ArrowRight size={16} />}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: '10px', fontWeight: 700, py: 1.25,
              background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #C4694D 0%, #B85A3D 100%)' },
            }}
          >
            Get Started
          </Button>

          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 1.5 }}>
            Upgrade anytime from Account Settings
          </Typography>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
