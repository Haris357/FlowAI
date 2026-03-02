'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, Chip, Card, CardContent,
} from '@mui/joy';
import { Crown, Check, ArrowRight, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { useColorScheme } from '@mui/joy/styles';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PLANS, formatMessages } from '@/lib/plans';

const DEBOUNCE_MS = 3600000; // 1 hour
const MAX_DISMISSALS = 3;
const INTERVAL_CHATS = 5;

async function shouldShowPremiumModal(userId: string, planId: string): Promise<boolean> {
  if (planId !== 'free') return false;

  // Session guard
  if (typeof window !== 'undefined' && sessionStorage.getItem('modal_shown_this_session')) return false;

  // localStorage debounce
  const lastChecked = localStorage.getItem('premium_prompt_last_checked');
  const now = Date.now();
  if (lastChecked && now - parseInt(lastChecked) < DEBOUNCE_MS) return false;
  localStorage.setItem('premium_prompt_last_checked', String(now));

  try {
    const ref = doc(db, 'users', userId, 'settings', 'premiumPrompt');
    const snap = await getDoc(ref);
    const data = snap.data();

    // Reset dismiss count on new period
    const currentPeriod = new Date().toISOString().slice(0, 7);
    if (data?.periodKey && data.periodKey !== currentPeriod) {
      await setDoc(ref, { dismissCount: 0, periodKey: currentPeriod }, { merge: true });
    } else if ((data?.dismissCount || 0) >= MAX_DISMISSALS) {
      return false;
    }

    // Check chat count
    const chatsSince = parseInt(localStorage.getItem('premium_chats_since_show') || '0');
    if (chatsSince < INTERVAL_CHATS) return false;
  } catch {
    return false;
  }

  return true;
}

interface PlanCardProps {
  name: string;
  price: number;
  sessionLimit: number;
  weeklyLimit: number;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

function PlanCard({ name, price, sessionLimit, weeklyLimit, features, current, popular }: PlanCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        opacity: current ? 0.6 : 1,
        borderColor: popular ? 'primary.400' : 'divider',
        borderWidth: popular ? 2 : 1,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {popular && (
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
      )}
      <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography level="body-sm" fontWeight={700} sx={{ mb: 0.5 }}>{name}</Typography>
        <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25}>
          <Typography level="title-lg" fontWeight={700}>${price}</Typography>
          {price > 0 && <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>}
        </Stack>
        <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
          {formatMessages(sessionLimit)} msgs/session · {formatMessages(weeklyLimit)}/week
        </Typography>
        <Stack spacing={0.5} alignItems="flex-start">
          {features.map((f, i) => (
            <Stack key={i} direction="row" spacing={0.5} alignItems="center">
              <Check size={12} style={{ color: current ? 'var(--joy-palette-neutral-400)' : 'var(--joy-palette-success-500)', flexShrink: 0 }} />
              <Typography level="body-xs" sx={{ textAlign: 'left' }}>{f}</Typography>
            </Stack>
          ))}
        </Stack>
        {current && (
          <Chip size="sm" variant="soft" color="neutral" sx={{ mt: 1, fontSize: '0.65rem' }}>
            Current
          </Chip>
        )}
      </CardContent>
    </Card>
  );
}

export default function PremiumModal() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const router = useRouter();
  const { mode } = useColorScheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid || plan.id !== 'free') return;
    shouldShowPremiumModal(user.uid, plan.id).then(show => {
      if (show) {
        setOpen(true);
        sessionStorage.setItem('modal_shown_this_session', 'true');
      }
    }).catch(() => {});
  }, [user?.uid, plan.id]);

  const handleDismiss = async () => {
    setOpen(false);
    if (!user?.uid) return;
    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'premiumPrompt');
      const snap = await getDoc(ref);
      const data = snap.data();
      const currentPeriod = new Date().toISOString().slice(0, 7);
      await setDoc(ref, {
        lastShown: serverTimestamp(),
        dismissCount: (data?.dismissCount || 0) + 1,
        periodKey: currentPeriod,
      }, { merge: true });
      localStorage.setItem('premium_chats_since_show', '0');
    } catch {}
  };

  const handleUpgrade = () => {
    setOpen(false);
    router.push('/settings/billing');
  };

  if (!open) return null;

  const isDark = mode === 'dark';

  return (
    <Modal open={open} onClose={handleDismiss}>
      <ModalDialog
        sx={{
          maxWidth: 560,
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
          background: 'linear-gradient(135deg, #D97757 0%, #E8956F 50%, #F0B090 100%)',
          textAlign: 'center',
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <Crown size={26} color="white" />
          </Box>
          <Typography level="h3" sx={{ color: 'white', fontWeight: 700 }}>
            Unlock the Full Power
          </Typography>
          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
            Get more AI messages per session, advanced AI models, and unlimited features
          </Typography>
        </Box>

        {/* Plan Comparison */}
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <PlanCard
              name="Free"
              price={PLANS.free.price}
              sessionLimit={PLANS.free.sessionMessageLimit}
              weeklyLimit={PLANS.free.weeklyMessageLimit}
              features={['1 company', '20 customers', 'Basic AI']}
              current
            />
            <PlanCard
              name="Pro"
              price={PLANS.pro.price}
              sessionLimit={PLANS.pro.sessionMessageLimit}
              weeklyLimit={PLANS.pro.weeklyMessageLimit}
              features={['3 companies', 'Unlimited clients', 'All reports']}
              popular
            />
            <PlanCard
              name="Max"
              price={PLANS.max.price}
              sessionLimit={PLANS.max.sessionMessageLimit}
              weeklyLimit={PLANS.max.weeklyMessageLimit}
              features={['10 companies', 'Advanced AI', 'Priority support']}
            />
          </Stack>

          {/* Highlights */}
          <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'background.level1', mb: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Sparkles size={14} style={{ color: 'var(--joy-palette-warning-500)' }} />
              <Typography level="body-xs" fontWeight={700} sx={{ textTransform: 'uppercase', color: 'text.tertiary', letterSpacing: '0.05em' }}>
                Why upgrade?
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              {[
                '4x more messages per session + higher weekly cap',
                'Unlock payroll, exports, and financial reports',
                'Manage multiple companies & collaborators',
              ].map((item, i) => (
                <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                  <Check size={13} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                  <Typography level="body-xs">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

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
              Upgrade Now
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
