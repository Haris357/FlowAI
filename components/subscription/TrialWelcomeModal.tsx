'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button,
} from '@mui/joy';
import {
  Sparkles, Clock, ArrowRight, ArrowLeft, Zap, Building2,
  FileText, BarChart3, MousePointerClick,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePathname } from 'next/navigation';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, TRIAL_DURATION_DAYS } from '@/lib/plans';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TabInfo {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const TABS: TabInfo[] = [
  {
    id: 'trial-welcome',
    icon: Sparkles,
    title: 'Welcome to Flowbooks!',
    description: `You have a ${TRIAL_DURATION_DAYS}-day Pro trial with full access. No credit card required.`,
  },
  {
    id: 'company-overview',
    icon: MousePointerClick,
    title: 'Your Companies',
    description: 'Click any company card to open its full dashboard — invoicing, banking, reports, and AI chat.',
  },
];

export default function TrialWelcomeModal() {
  const { user } = useAuth();
  const { isTrial, isTrialExpired: trialExpired, trialTimeLeft, loading: subLoading } = useSubscription();
  const { mode } = useColorScheme();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState(0);

  const isCompaniesPage = pathname === '/companies';
  const isDark = mode === 'dark';
  const currentTab = TABS[tab];
  const isLastTab = tab === TABS.length - 1;

  useEffect(() => {
    if (subLoading || !user?.uid || !isTrial || trialExpired || !isCompaniesPage) return;
    let cancelled = false;

    const ref = doc(db, 'users', user.uid, 'settings', 'trialWelcome');
    getDoc(ref).then(snap => {
      if (cancelled) return;
      if (!snap.exists() || !snap.data()?.shown) {
        setDoc(ref, { shown: true, shownAt: new Date() }, { merge: true })
          .then(() => { if (!cancelled) setActive(true); })
          .catch(() => { if (!cancelled) setActive(true); });
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [user?.uid, isTrial, trialExpired, subLoading, isCompaniesPage]);

  const handleClose = () => {
    setActive(false);
    setTab(0);
  };

  const handleNext = () => {
    if (isLastTab) handleClose();
    else setTab(t => t + 1);
  };

  const handlePrev = () => {
    if (tab > 0) setTab(t => t - 1);
  };

  if (!active || !currentTab) return null;

  const TabIcon = currentTab.icon;

  // Tab 0: Trial welcome with feature highlights
  if (tab === 0) {
    return (
      <Modal open={active} onClose={handleClose}>
        <ModalDialog sx={{
          maxWidth: { xs: '95vw', sm: 380 }, width: '100%', p: 0, overflow: 'hidden', borderRadius: '20px',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark ? '0 32px 64px rgba(0,0,0,0.5)' : '0 32px 64px rgba(0,0,0,0.12)',
        }}>
          <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217,119,87,0.3)',
              }}>
                <Sparkles size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: isDark ? '#EEECE8' : '#1A1915' }}>
                  {currentTab.title}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#A8A29E' : '#78736D', mt: 0.25 }}>
                  {currentTab.description}
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, mb: 2, borderRadius: '10px',
              bgcolor: isDark ? 'rgba(217,119,87,0.1)' : '#FFF8F5',
              border: '1px solid', borderColor: isDark ? 'rgba(217,119,87,0.2)' : '#FFEEE6',
            }}>
              <Clock size={14} color="#D97757" />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#D97757' }}>
                {trialTimeLeft || `${TRIAL_DURATION_DAYS}d`} remaining
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#5C5752' : '#A8A29E', ml: 'auto' }}>
                No card needed
              </Typography>
            </Box>

            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              {[
                { icon: Zap, text: 'Extended AI usage per session (4h)' },
                { icon: Building2, text: `Up to ${PLANS.pro.maxCompanies} companies` },
                { icon: FileText, text: 'Unlimited customers, invoices & billing' },
                { icon: BarChart3, text: 'All reports, payroll & exports' },
              ].map((h, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4 }}>
                  <Box sx={{
                    width: 26, height: 26, borderRadius: '7px', flexShrink: 0,
                    bgcolor: isDark ? 'rgba(217,119,87,0.1)' : '#FFF0E8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <h.icon size={13} color="#D97757" />
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: isDark ? '#EEECE8' : '#44403C' }}>
                    {h.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button variant="plain" onClick={handleClose}
                sx={{ flex: 1, borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem', color: isDark ? '#A8A29E' : '#78736D' }}>
                Close
              </Button>
              <Button endDecorator={<ArrowRight size={15} />} onClick={handleNext}
                sx={{ flex: 1, borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem', bgcolor: isDark ? '#D97757' : '#1A1915', color: '#fff', '&:hover': { bgcolor: isDark ? '#C4694D' : '#2C2A27' } }}>
                Next
              </Button>
            </Stack>
            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#3D3A37' : '#D6D3D1', textAlign: 'center', mt: 1.25 }}>
              {tab + 1} of {TABS.length}
            </Typography>
          </Box>
        </ModalDialog>
      </Modal>
    );
  }

  // Tab 1: Your Companies
  return (
    <Modal open={active} onClose={handleClose}>
      <ModalDialog sx={{
        maxWidth: { xs: '95vw', sm: 380 }, width: '100%', p: 0, overflow: 'hidden', borderRadius: '20px',
        bgcolor: isDark ? '#1C1B19' : '#fff',
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        boxShadow: isDark ? '0 32px 64px rgba(0,0,0,0.5)' : '0 32px 64px rgba(0,0,0,0.12)',
      }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              bgcolor: isDark ? 'rgba(217,119,87,0.15)' : '#FFF0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TabIcon size={17} color="#D97757" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, color: isDark ? '#EEECE8' : '#1A1915' }}>
                {currentTab.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: isDark ? '#A8A29E' : '#78736D', mt: 0.4, lineHeight: 1.45 }}>
                {currentTab.description}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#5C5752' : '#A8A29E', flex: 1 }}>
              {tab + 1} of {TABS.length}
            </Typography>
            <Button size="sm" variant="plain" startDecorator={<ArrowLeft size={13} />} onClick={handlePrev}
              sx={{ fontSize: '0.76rem', fontWeight: 600, px: 1.25, py: 0.4, borderRadius: '8px', color: isDark ? '#A8A29E' : '#78736D' }}>
              Back
            </Button>
            <Button size="sm" onClick={handleClose}
              sx={{ fontSize: '0.76rem', fontWeight: 600, px: 1.5, py: 0.4, borderRadius: '8px', bgcolor: isDark ? '#D97757' : '#1A1915', color: '#fff', '&:hover': { bgcolor: isDark ? '#C4694D' : '#2C2A27' } }}>
              Get Started
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
