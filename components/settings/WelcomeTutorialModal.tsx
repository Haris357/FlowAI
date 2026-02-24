'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Stack, IconButton, Chip,
} from '@mui/joy';
import {
  Rocket, LayoutDashboard, MessageCircle, ShoppingCart, Receipt,
  Landmark, Briefcase, Calculator, BarChart3, PartyPopper,
  ChevronRight, ChevronLeft, X, Check, Lightbulb, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
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

const STEP_COLORS: Record<string, string> = {
  welcome: '#D97757',
  dashboard: '#3b82f6',
  'flow-ai': '#D97757',
  sales: '#10b981',
  purchases: '#f59e0b',
  banking: '#6366f1',
  people: '#ec4899',
  accounting: '#8b5cf6',
  reports: '#06b6d4',
  completion: '#10b981',
};

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function WelcomeTutorialModal() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Only show on company routes (after user has created a company)
  const isCompanyRoute = pathname?.startsWith('/companies/') && pathname.split('/').length > 2;

  // Check if tutorial completed — only when inside a company route
  useEffect(() => {
    if (!user?.uid || !isCompanyRoute) return;
    const ref = doc(db, 'users', user.uid, 'settings', 'tutorial');
    getDoc(ref).then(snap => {
      if (!snap.exists() || !snap.data()?.completed) {
        setActive(true);
      }
    }).catch(() => {});
  }, [user?.uid, isCompanyRoute]);

  // Find and highlight the target element
  const updateSpotlight = useCallback(() => {
    const current = TUTORIAL_STEPS[step];
    if (!current?.target) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlight({
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      });
    } else {
      setSpotlight(null);
    }
  }, [step]);

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
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'tutorial'), {
        completed: true,
        completedAt: new Date(),
      });
    } catch {}
  };

  const goNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
      }, 150);
    } else {
      handleClose();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s - 1);
        setAnimating(false);
      }, 150);
    }
  };

  if (!active) return null;

  const current = TUTORIAL_STEPS[step];
  const Icon = STEP_ICONS[current.id] || Rocket;
  const accentColor = STEP_COLORS[current.id] || '#D97757';
  const isOverlayStep = !current.target;
  const isWelcome = current.id === 'welcome';
  const isCompletion = current.id === 'completion';
  const totalSteps = TUTORIAL_STEPS.length;

  // Calculate tooltip position (to the right of spotlight, or centered if no spotlight)
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight) return {};
    const tooltipWidth = 380;
    const gap = 16;
    const spaceRight = window.innerWidth - (spotlight.left + spotlight.width + gap + tooltipWidth);
    if (spaceRight > 0) {
      // Position to the right
      return {
        position: 'fixed',
        top: Math.max(16, Math.min(spotlight.top, window.innerHeight - 400)),
        left: spotlight.left + spotlight.width + gap,
      };
    }
    // Position below
    return {
      position: 'fixed',
      top: spotlight.top + spotlight.height + gap,
      left: Math.max(16, spotlight.left - 100),
    };
  };

  const tooltipStyle = getTooltipStyle();
  const isRightPositioned = spotlight && tooltipStyle.left && (tooltipStyle.left as number) > spotlight.left + spotlight.width;

  // ─── Welcome Screen ───
  if (isWelcome) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}>
        <Box sx={{
          width: '100%', maxWidth: 560, mx: 2, borderRadius: '16px',
          overflow: 'hidden', bgcolor: 'background.surface',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          opacity: animating ? 0 : 1,
          transform: animating ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}>
          {/* Gradient Header */}
          <Box sx={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #C4694D 100%)`,
            px: 4, pt: 5, pb: 4, textAlign: 'center', position: 'relative',
          }}>
            <IconButton
              size="sm" variant="plain"
              onClick={handleClose}
              sx={{
                position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.7)',
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            >
              <X size={18} />
            </IconButton>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
              bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(255,255,255,0.1)',
            }}>
              <Sparkles size={32} color="#fff" />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
              {current.title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 1, fontSize: '0.95rem' }}>
              {current.description}
            </Typography>
          </Box>

          {/* Feature Grid */}
          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5,
            }}>
              {current.features?.map((feat, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{
                  p: 1.5, borderRadius: '10px', bgcolor: 'background.level1',
                  border: '1px solid', borderColor: 'divider',
                }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    bgcolor: `${accentColor}18`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={14} style={{ color: accentColor }} />
                  </Box>
                  <Typography level="body-xs" fontWeight={500} sx={{ lineHeight: 1.3 }}>
                    {feat}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{
            px: 4, pb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Button
              variant="plain" color="neutral" size="sm"
              onClick={handleClose}
              sx={{ fontSize: '0.85rem' }}
            >
              Skip Tour
            </Button>
            <Button
              endDecorator={<ChevronRight size={16} />}
              onClick={goNext}
              sx={{
                px: 3, fontWeight: 600, borderRadius: '10px',
                background: `linear-gradient(135deg, ${accentColor} 0%, #C4694D 100%)`,
                '&:hover': { background: `linear-gradient(135deg, #C4694D 0%, ${accentColor} 100%)` },
              }}
            >
              Start Tour
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Completion Screen ───
  if (isCompletion) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}>
        <Box sx={{
          width: '100%', maxWidth: 480, mx: 2, borderRadius: '16px',
          overflow: 'hidden', bgcolor: 'background.surface',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          opacity: animating ? 0 : 1,
          transform: animating ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}>
          {/* Header */}
          <Box sx={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
            px: 4, pt: 5, pb: 4, textAlign: 'center',
          }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
              bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(255,255,255,0.1)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { boxShadow: '0 0 0 8px rgba(255,255,255,0.1)' },
                '50%': { boxShadow: '0 0 0 16px rgba(255,255,255,0.05)' },
              },
            }}>
              <PartyPopper size={32} color="#fff" />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
              {current.title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 1, fontSize: '0.95rem' }}>
              {current.description}
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ px: 4, py: 3 }}>
            <Typography level="body-sm" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
              Quick Start
            </Typography>
            <Stack spacing={1}>
              {[
                { icon: LayoutDashboard, label: 'Explore your Dashboard', color: '#3b82f6' },
                { icon: MessageCircle, label: 'Chat with Flow AI', color: '#D97757' },
                { icon: ShoppingCart, label: 'Create your first Invoice', color: '#10b981' },
              ].map((action, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{
                  p: 1.5, borderRadius: '10px', bgcolor: 'background.level1',
                  border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  '&:hover': { borderColor: action.color, bgcolor: `${action.color}08` },
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                    bgcolor: `${action.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <action.icon size={16} style={{ color: action.color }} />
                  </Box>
                  <Typography level="body-sm" fontWeight={500}>{action.label}</Typography>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--joy-palette-text-tertiary)' }} />
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Done Button */}
          <Box sx={{ px: 4, pb: 3, textAlign: 'center' }}>
            <Button
              onClick={handleClose}
              fullWidth
              sx={{
                py: 1.2, fontWeight: 600, borderRadius: '10px', fontSize: '0.95rem',
                background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
                '&:hover': { background: `linear-gradient(135deg, #059669 0%, ${accentColor} 100%)` },
              }}
            >
              Let&apos;s Go!
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Spotlight Tour Step ───
  return (
    <>
      {/* Overlay with spotlight cutout */}
      <Box
        onClick={goNext}
        sx={{
          position: 'fixed', inset: 0, zIndex: 9998,
          cursor: 'pointer',
          // Dark overlay with cutout via box-shadow
          ...(spotlight ? {
            '&::before': {
              content: '""',
              position: 'fixed',
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: '8px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              zIndex: 9998,
              pointerEvents: 'none',
              transition: 'all 0.3s ease',
            },
          } : {
            bgcolor: 'rgba(0,0,0,0.55)',
          }),
        }}
      />

      {/* Spotlight ring glow */}
      {spotlight && (
        <Box sx={{
          position: 'fixed',
          top: spotlight.top - 2,
          left: spotlight.left - 2,
          width: spotlight.width + 4,
          height: spotlight.height + 4,
          borderRadius: '10px',
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}40, inset 0 0 20px ${accentColor}10`,
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          animation: 'spotlightPulse 2s ease-in-out infinite',
          '@keyframes spotlightPulse': {
            '0%, 100%': { boxShadow: `0 0 20px ${accentColor}40, inset 0 0 20px ${accentColor}10` },
            '50%': { boxShadow: `0 0 30px ${accentColor}60, inset 0 0 30px ${accentColor}20` },
          },
        }} />
      )}

      {/* Tooltip Card */}
      <Box
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...(spotlight ? tooltipStyle : {
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }),
          width: 380, maxWidth: 'calc(100vw - 32px)',
          zIndex: 10000,
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.15s ease, top 0.3s ease, left 0.3s ease',
        }}
      >
        {/* Arrow */}
        {spotlight && isRightPositioned && (
          <Box sx={{
            position: 'absolute',
            left: -8,
            top: 24,
            width: 0, height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid',
            borderRightColor: accentColor,
            zIndex: 1,
          }} />
        )}

        <Box sx={{
          borderRadius: '14px',
          overflow: 'hidden',
          bgcolor: 'background.surface',
          boxShadow: `0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px ${accentColor}30`,
        }}>
          {/* Colored top bar */}
          <Box sx={{
            height: 4,
            background: `linear-gradient(90deg, ${accentColor} ${((step + 1) / totalSteps) * 100}%, var(--joy-palette-neutral-200) ${((step + 1) / totalSteps) * 100}%)`,
          }} />

          {/* Header */}
          <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  bgcolor: `${accentColor}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: accentColor }} />
                </Box>
                <Box>
                  <Typography fontWeight={700} sx={{ fontSize: '1.05rem', lineHeight: 1.2 }}>
                    {current.title}
                  </Typography>
                  <Chip size="sm" variant="soft" sx={{
                    mt: 0.5, fontSize: '0.7rem', height: 20,
                    bgcolor: `${accentColor}15`, color: accentColor,
                  }}>
                    {step} of {totalSteps - 2}
                  </Chip>
                </Box>
              </Stack>
              <IconButton
                size="sm" variant="plain" color="neutral"
                onClick={handleClose}
                sx={{ mt: -0.5, mr: -0.5 }}
              >
                <X size={16} />
              </IconButton>
            </Stack>
          </Box>

          {/* Body */}
          <Box sx={{ px: 3, pt: 1.5, pb: 2 }}>
            <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              {current.description}
            </Typography>

            {/* Feature bullets */}
            {current.features && current.features.length > 0 && (
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {current.features.map((feat, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Box sx={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, mt: '1px',
                      bgcolor: `${accentColor}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} style={{ color: accentColor }} />
                    </Box>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                      {feat}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            {/* Tip */}
            {current.tip && (
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{
                mt: 1.5, p: 1.5, borderRadius: '8px',
                bgcolor: `${accentColor}08`, border: '1px solid', borderColor: `${accentColor}20`,
              }}>
                <Lightbulb size={14} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
                <Typography level="body-xs" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                  {current.tip}
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Footer Navigation */}
          <Box sx={{
            px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {/* Progress dots */}
            <Stack direction="row" spacing={0.5}>
              {TUTORIAL_STEPS.filter(s => s.target !== null).map((s, i) => (
                <Box key={s.id} sx={{
                  width: step - 1 === i ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: step - 1 === i ? accentColor : 'neutral.300',
                  transition: 'all 0.2s ease',
                }} />
              ))}
            </Stack>

            {/* Buttons */}
            <Stack direction="row" spacing={1}>
              {step > 1 && (
                <IconButton
                  size="sm" variant="outlined" color="neutral"
                  onClick={goPrev}
                  sx={{ borderRadius: '8px', width: 32, height: 32 }}
                >
                  <ChevronLeft size={16} />
                </IconButton>
              )}
              <Button
                size="sm"
                endDecorator={step < totalSteps - 2 ? <ChevronRight size={14} /> : undefined}
                onClick={goNext}
                sx={{
                  px: 2, borderRadius: '8px', fontWeight: 600,
                  bgcolor: accentColor,
                  '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
                }}
              >
                {step < totalSteps - 2 ? 'Next' : 'Finish'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
