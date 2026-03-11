'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, ModalDialog, Typography, Box, Stack, Button, LinearProgress,
} from '@mui/joy';
import {
  Sparkles, Clock, ArrowRight, ArrowLeft, X, Zap, Building2,
  FileText, BarChart3, Plus, Bell, Settings, MousePointerClick,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePathname } from 'next/navigation';
import { useColorScheme } from '@mui/joy/styles';
import { PLANS, TRIAL_DURATION_DAYS } from '@/lib/plans';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourStep {
  id: string;
  type: 'modal' | 'spotlight';
  target?: string;
  icon: React.ElementType;
  title: string;
  description: string;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    id: 'trial-welcome',
    type: 'modal',
    icon: Sparkles,
    title: 'Welcome to Flowbooks!',
    description: `You have a ${TRIAL_DURATION_DAYS}-day Pro trial with full access. No credit card required.`,
  },
  {
    id: 'company-overview',
    type: 'modal',
    icon: MousePointerClick,
    title: 'Your Companies',
    description: 'Click any company card to open its full dashboard — invoicing, banking, reports, and AI chat.',
  },
  {
    id: 'new-company',
    type: 'modal',
    icon: Plus,
    title: 'Create a Company',
    description: 'Use the "+ New Company" button (top right) to add and manage multiple businesses separately.',
  },
  {
    id: 'notifications',
    type: 'spotlight',
    target: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Billing alerts, updates, and messages appear here.',
    placement: 'bottom',
  },
  {
    id: 'settings',
    type: 'spotlight',
    target: 'settings',
    icon: Settings,
    title: 'Account Settings',
    description: 'Manage your profile, subscription, and preferences.',
    placement: 'bottom',
  },
];

export default function TrialWelcomeModal() {
  const { user } = useAuth();
  const { isTrial, isTrialExpired: trialExpired, trialTimeLeft, loading: subLoading } = useSubscription();
  const { mode } = useColorScheme();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isCompaniesPage = pathname === '/companies';
  const isDark = mode === 'dark';
  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (subLoading || !user?.uid || !isTrial || trialExpired || !isCompaniesPage) return;

    const ref = doc(db, 'users', user.uid, 'settings', 'trialWelcome');
    getDoc(ref).then(snap => {
      if (!snap.exists() || !snap.data()?.shown) {
        setDoc(ref, { shown: true, shownAt: new Date() }, { merge: true })
          .then(() => setActive(true))
          .catch(() => setActive(true));
      }
    }).catch(() => {});
  }, [user?.uid, isTrial, trialExpired, subLoading, isCompaniesPage]);

  const updateSpotlight = useCallback(() => {
    if (!currentStep?.target) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlight({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      });
    } else {
      setSpotlight(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [active, step, updateSpotlight]);

  const handleClose = () => {
    setActive(false);
    setStep(0);
    setSpotlight(null);
  };

  const handleNext = () => {
    if (isLastStep) handleClose();
    else setStep(s => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!active) return null;

  const StepIcon = currentStep.icon;

  // Clamp tooltip within viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight || currentStep.type === 'modal') return {};
    const gap = 12;
    const tooltipW = 300;
    const placement = currentStep.placement || 'bottom';
    const style: React.CSSProperties = { position: 'fixed', zIndex: 10002, width: tooltipW };

    const centerX = spotlight.left + spotlight.width / 2 - tooltipW / 2;
    const clampedX = Math.max(12, Math.min(centerX, window.innerWidth - tooltipW - 12));

    if (placement === 'bottom') {
      style.top = spotlight.top + spotlight.height + gap;
      style.left = clampedX;
    } else if (placement === 'top') {
      style.bottom = window.innerHeight - spotlight.top + gap;
      style.left = clampedX;
    } else if (placement === 'left') {
      style.top = Math.max(12, spotlight.top + spotlight.height / 2 - 50);
      style.right = window.innerWidth - spotlight.left + gap;
    } else {
      style.top = Math.max(12, spotlight.top + spotlight.height / 2 - 50);
      style.left = spotlight.left + spotlight.width + gap;
    }

    return style;
  };

  // Shared tooltip card content
  const renderTooltipContent = (inModal?: boolean) => (
    <Box sx={{ p: inModal ? 3 : 2 }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
          bgcolor: isDark ? 'rgba(217,119,87,0.15)' : '#FFF0E8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StepIcon size={17} color="#D97757" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, color: isDark ? '#EEECE8' : '#1A1915' }}>
            {currentStep.title}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: isDark ? '#A8A29E' : '#78736D', mt: 0.4, lineHeight: 1.45 }}>
            {currentStep.description}
          </Typography>
        </Box>
        {!inModal && (
          <Button size="sm" variant="plain" onClick={handleClose}
            sx={{ minWidth: 0, p: 0.25, borderRadius: '50%', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' } }}>
            <X size={14} />
          </Button>
        )}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#5C5752' : '#A8A29E', flex: 1 }}>
          {step + 1} / {STEPS.length}
        </Typography>
        {step > 0 && (
          <Button size="sm" variant="plain" startDecorator={<ArrowLeft size={13} />} onClick={handlePrev}
            sx={{ fontSize: '0.76rem', fontWeight: 600, px: 1.25, py: 0.4, borderRadius: '8px', color: isDark ? '#A8A29E' : '#78736D' }}>
            Back
          </Button>
        )}
        <Button size="sm" endDecorator={isLastStep ? undefined : <ArrowRight size={13} />} onClick={handleNext}
          sx={{ fontSize: '0.76rem', fontWeight: 600, px: 1.5, py: 0.4, borderRadius: '8px', bgcolor: isDark ? '#D97757' : '#1A1915', color: '#fff', '&:hover': { bgcolor: isDark ? '#C4694D' : '#2C2A27' } }}>
          {isLastStep ? 'Done' : 'Next'}
        </Button>
      </Stack>
    </Box>
  );

  // Progress bar component
  const progressBar = (
    <LinearProgress determinate value={progress} sx={{
      '--LinearProgress-thickness': '3px',
      '--LinearProgress-progressColor': '#D97757',
      '--LinearProgress-bgcolor': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    }} />
  );

  // Step 0: Trial welcome modal with extra content
  if (step === 0 && currentStep.type === 'modal') {
    return (
      <Modal open={active} onClose={handleClose}>
        <ModalDialog sx={{
          maxWidth: 380, width: '92%', p: 0, overflow: 'hidden', borderRadius: '20px',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark ? '0 32px 64px rgba(0,0,0,0.5)' : '0 32px 64px rgba(0,0,0,0.12)',
        }}>
          {progressBar}
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
                  {currentStep.title}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#A8A29E' : '#78736D', mt: 0.25 }}>
                  {currentStep.description}
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
                Skip Tour
              </Button>
              <Button endDecorator={<ArrowRight size={15} />} onClick={handleNext}
                sx={{ flex: 1, borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem', bgcolor: isDark ? '#D97757' : '#1A1915', color: '#fff', '&:hover': { bgcolor: isDark ? '#C4694D' : '#2C2A27' } }}>
                Take a Tour
              </Button>
            </Stack>
            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#3D3A37' : '#D6D3D1', textAlign: 'center', mt: 1.25 }}>
              Step {step + 1} of {STEPS.length}
            </Typography>
          </Box>
        </ModalDialog>
      </Modal>
    );
  }

  // Other modal steps (no spotlight, centered card — same overlay as spotlight for consistency)
  if (currentStep.type === 'modal') {
    return (
      <>
        <Box onClick={handleClose} sx={{ position: 'fixed', inset: 0, zIndex: 10000, bgcolor: 'rgba(0,0,0,0.5)' }} />
        <Box onClick={e => e.stopPropagation()} sx={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 10002, width: 340, maxWidth: '90%',
          borderRadius: '16px', overflow: 'hidden',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.12)',
        }}>
          {progressBar}
          {renderTooltipContent(true)}
        </Box>
      </>
    );
  }

  // Spotlight steps
  return (
    <>
      <Box onClick={handleClose} sx={{ position: 'fixed', inset: 0, zIndex: 10000, bgcolor: 'rgba(0,0,0,0.5)' }} />

      {spotlight && (
        <Box sx={{
          position: 'fixed', top: spotlight.top, left: spotlight.left,
          width: spotlight.width, height: spotlight.height, zIndex: 10001,
          borderRadius: '10px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          border: '2px solid rgba(217,119,87,0.5)',
        }} />
      )}

      <Box ref={tooltipRef} onClick={e => e.stopPropagation()}
        sx={{
          ...getTooltipStyle(),
          borderRadius: '14px', overflow: 'hidden',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.15)',
        }}>
        {progressBar}
        {renderTooltipContent()}
      </Box>
    </>
  );
}
