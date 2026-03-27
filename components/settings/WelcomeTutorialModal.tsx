'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, ModalDialog, Box, Typography, Button, Stack, LinearProgress,
} from '@mui/joy';
import {
  Rocket, LayoutDashboard, MessageCircle, ShoppingCart, Receipt,
  Landmark, Briefcase, Calculator, BarChart3, PartyPopper,
  ArrowRight, ArrowLeft, X, Check, Lightbulb, Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useColorScheme } from '@mui/joy/styles';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TUTORIAL_STEPS, type TutorialStep } from '@/lib/docs';

const STEP_ICONS: Record<string, React.ElementType> = {
  welcome: Rocket,
  dashboard: LayoutDashboard,
  'flow-ai': MessageCircle,
  sales: ShoppingCart,
  purchases: Receipt,
  banking: Landmark,
  people: Briefcase,
  accounting: Calculator,
  reports: BarChart3,
  completion: PartyPopper,
};

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function WelcomeTutorialModal({ onReportIssue }: { onReportIssue?: () => void }) {
  const { user } = useAuth();
  const { mode } = useColorScheme();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isDark = mode === 'dark';
  const isCompanyRoute = pathname?.startsWith('/companies/') && pathname.split('/').length > 2;
  const currentStep = TUTORIAL_STEPS[step];
  const isLastStep = step === TUTORIAL_STEPS.length - 1;
  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;
  const Icon = STEP_ICONS[currentStep?.id] || Rocket;

  useEffect(() => {
    if (!user?.uid || !isCompanyRoute) return;
    const timeout = setTimeout(() => {
      const ref = doc(db, 'users', user.uid, 'settings', 'tutorial');
      getDoc(ref).then(snap => {
        if (!snap.exists() || !snap.data()?.completed) {
          setActive(true);
        }
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [user?.uid, isCompanyRoute]);

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

  const handleClose = async () => {
    setActive(false);
    setStep(0);
    setSpotlight(null);
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'tutorial'), {
        completed: true,
        completedAt: new Date(),
      });
    } catch {}
  };

  const handleNext = () => {
    if (isLastStep) handleClose();
    else setStep(s => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!active || !currentStep) return null;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight || !currentStep.target) return {};
    const gap = 12;
    const tooltipW = 320;
    const style: React.CSSProperties = { position: 'fixed', zIndex: 10002, width: tooltipW };

    const spaceRight = window.innerWidth - (spotlight.left + spotlight.width + gap + tooltipW);
    const spaceBottom = window.innerHeight - (spotlight.top + spotlight.height + gap + 200);

    if (spaceRight > 12) {
      style.top = Math.max(12, Math.min(spotlight.top, window.innerHeight - 300));
      style.left = spotlight.left + spotlight.width + gap;
    } else if (spaceBottom > 12) {
      const centerX = spotlight.left + spotlight.width / 2 - tooltipW / 2;
      style.top = spotlight.top + spotlight.height + gap;
      style.left = Math.max(12, Math.min(centerX, window.innerWidth - tooltipW - 12));
    } else {
      const centerX = spotlight.left + spotlight.width / 2 - tooltipW / 2;
      style.bottom = window.innerHeight - spotlight.top + gap;
      style.left = Math.max(12, Math.min(centerX, window.innerWidth - tooltipW - 12));
    }

    return style;
  };

  const progressBar = (
    <LinearProgress determinate value={progress} sx={{
      '--LinearProgress-thickness': '3px',
      '--LinearProgress-progressColor': '#D97757',
      '--LinearProgress-bgcolor': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    }} />
  );

  const renderTooltipContent = (inModal?: boolean) => (
    <Box sx={{ p: inModal ? 3 : 2 }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
          bgcolor: isDark ? 'rgba(217,119,87,0.15)' : '#FFF0E8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color="#D97757" />
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

      {/* Feature bullets */}
      {currentStep.features && currentStep.features.length > 0 && (
        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
          {currentStep.features.map((feat, i) => (
            <Stack key={i} direction="row" spacing={0.75} alignItems="center" sx={{ py: 0.2 }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: '5px', flexShrink: 0,
                bgcolor: isDark ? 'rgba(217,119,87,0.1)' : '#FFF0E8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={10} color="#D97757" />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#EEECE8' : '#44403C', lineHeight: 1.3 }}>
                {feat}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {/* Tip */}
      {currentStep.tip && (
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 0.75, px: 1.25, py: 1, mb: 1.5, borderRadius: '8px',
          bgcolor: isDark ? 'rgba(217,119,87,0.08)' : '#FFF8F5',
          border: '1px solid', borderColor: isDark ? 'rgba(217,119,87,0.15)' : '#FFEEE6',
        }}>
          <Lightbulb size={12} color="#D97757" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#A8A29E' : '#78736D', lineHeight: 1.4 }}>
            {currentStep.tip}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#5C5752' : '#A8A29E', flex: 1 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
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

  // Welcome step (step 0) — centered modal with features
  if (step === 0 && !currentStep.target) {
    return (
      <Modal open={active} onClose={handleClose}>
        <ModalDialog sx={{
          maxWidth: { xs: '95vw', sm: 380 }, width: '100%', p: 0, overflow: 'hidden', borderRadius: '20px',
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
                <Rocket size={22} color="white" />
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

            {currentStep.features && (
              <Stack spacing={0.5} sx={{ mb: 2.5 }}>
                {currentStep.features.map((feat, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4 }}>
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '7px', flexShrink: 0,
                      bgcolor: isDark ? 'rgba(217,119,87,0.1)' : '#FFF0E8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={13} color="#D97757" />
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: isDark ? '#EEECE8' : '#44403C' }}>
                      {feat}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={1}>
              <Button variant="plain" onClick={handleClose}
                sx={{ flex: 1, borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem', color: isDark ? '#A8A29E' : '#78736D' }}>
                Skip Tour
              </Button>
              <Button endDecorator={<ArrowRight size={15} />} onClick={handleNext}
                sx={{ flex: 1, borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem', bgcolor: isDark ? '#D97757' : '#1A1915', color: '#fff', '&:hover': { bgcolor: isDark ? '#C4694D' : '#2C2A27' } }}>
                Start Tour
              </Button>
            </Stack>
            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#3D3A37' : '#D6D3D1', textAlign: 'center', mt: 1.25 }}>
              Step {step + 1} of {TUTORIAL_STEPS.length}
            </Typography>

            {onReportIssue && (
              <Stack alignItems="center" sx={{ mt: 1 }}>
                <Button
                  variant="plain"
                  size="sm"
                  startDecorator={<Flag size={11} />}
                  onClick={onReportIssue}
                  sx={{
                    fontSize: '0.7rem',
                    color: isDark ? '#5C5752' : '#C2BEBC',
                    '&:hover': { color: isDark ? '#A8A29E' : '#78736D', bgcolor: 'transparent' },
                  }}
                >
                  Report an issue
                </Button>
              </Stack>
            )}
          </Box>
        </ModalDialog>
      </Modal>
    );
  }

  // Completion step (last) or any modal step without target — centered modal
  if (!currentStep.target) {
    return (
      <Modal open={active} onClose={handleClose}>
        <ModalDialog sx={{
          maxWidth: { xs: '95vw', sm: 340 }, width: '100%', p: 0, overflow: 'hidden', borderRadius: '16px',
          bgcolor: isDark ? '#1C1B19' : '#fff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.12)',
        }}>
          {progressBar}
          {renderTooltipContent(true)}
        </ModalDialog>
      </Modal>
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
