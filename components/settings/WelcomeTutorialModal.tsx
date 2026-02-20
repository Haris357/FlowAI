'use client';
import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, LinearProgress,
} from '@mui/joy';
import { Rocket, Building2, Users, FileText, MessageCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TUTORIAL_STEPS } from '@/lib/docs';

const STEP_ICONS: React.ElementType[] = [Rocket, Building2, Users, FileText, MessageCircle];

export default function WelcomeTutorialModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid, 'settings', 'tutorial');
    getDoc(ref).then(snap => {
      if (!snap.exists() || !snap.data()?.completed) {
        setOpen(true);
      }
    }).catch(() => {});
  }, [user?.uid]);

  const handleClose = async () => {
    setOpen(false);
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'tutorial'), { completed: true });
    } catch {}
  };

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const current = TUTORIAL_STEPS[step];
  const Icon = STEP_ICONS[step] || Rocket;
  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ maxWidth: 440, p: 3 }}>
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Button size="sm" variant="plain" color="neutral" onClick={handleClose} sx={{ minWidth: 0, p: 0.5 }}>
            <X size={18} />
          </Button>
        </Box>

        <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%', bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={28} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>

          <Box>
            <Typography level="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {current.title}
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              {current.description}
            </Typography>
          </Box>

          <Box sx={{ width: '100%' }}>
            <LinearProgress
              determinate
              value={progress}
              sx={{ height: 4, borderRadius: 2 }}
            />
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Step {step + 1} of {TUTORIAL_STEPS.length}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
            {step > 0 && (
              <Button
                variant="outlined"
                color="neutral"
                startDecorator={<ChevronLeft size={16} />}
                onClick={handlePrev}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
            )}
            <Button
              endDecorator={step < TUTORIAL_STEPS.length - 1 ? <ChevronRight size={16} /> : undefined}
              onClick={handleNext}
              sx={{ flex: 1 }}
            >
              {step < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
