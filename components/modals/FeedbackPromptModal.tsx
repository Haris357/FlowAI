'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, Typography, Stack, Button, Box, Textarea, IconButton,
} from '@mui/joy';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createFeedback } from '@/services/support';
import toast from 'react-hot-toast';

const DEBOUNCE_MS = 3600000; // 1 hour
const COOLDOWN_DAYS = 30;
const INTERVAL_DAYS = 7;
const INTERVAL_CHATS = 10;

async function shouldShowFeedbackModal(userId: string): Promise<boolean> {
  // Session guard — only one periodic modal per session
  if (typeof window !== 'undefined' && sessionStorage.getItem('modal_shown_this_session')) return false;

  // localStorage debounce
  const lastChecked = localStorage.getItem('fb_prompt_last_checked');
  const now = Date.now();
  if (lastChecked && now - parseInt(lastChecked) < DEBOUNCE_MS) return false;
  localStorage.setItem('fb_prompt_last_checked', String(now));

  try {
    // Check admin toggle
    const settingsSnap = await getDoc(doc(db, 'appSettings', 'feedback'));
    if (settingsSnap.exists() && settingsSnap.data().enabled === false) return false;

    // Check user's feedback prompt state
    const promptSnap = await getDoc(doc(db, 'users', userId, 'settings', 'feedbackPrompt'));
    const promptData = promptSnap.data();

    // Don't show if submitted recently
    if (promptData?.completedAt) {
      const completedDate = promptData.completedAt.toDate();
      const daysSince = (now - completedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return false;
    }

    // Check time since last shown
    const lastShown = promptData?.lastShown?.toDate();
    const daysSinceShown = lastShown ? (now - lastShown.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
    if (daysSinceShown >= INTERVAL_DAYS) return true;

    // Check chat count
    const chatsSince = parseInt(localStorage.getItem('fb_chats_since_show') || '0');
    if (chatsSince >= INTERVAL_CHATS) return true;
  } catch {
    return false;
  }

  return false;
}

export default function FeedbackPromptModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    shouldShowFeedbackModal(user.uid).then(show => {
      if (show) {
        setOpen(true);
        sessionStorage.setItem('modal_shown_this_session', 'true');
      }
    }).catch(() => {});
  }, [user?.uid]);

  const handleDismiss = async () => {
    setOpen(false);
    if (!user?.uid) return;
    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'feedbackPrompt');
      const snap = await getDoc(ref);
      const current = snap.data();
      await setDoc(ref, {
        ...current,
        lastShown: serverTimestamp(),
        dismissCount: (current?.dismissCount || 0) + 1,
      }, { merge: true });
      localStorage.setItem('fb_chats_since_show', '0');
    } catch {}
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!user?.uid || !user?.email) return;

    setSubmitting(true);
    try {
      await createFeedback({
        userId: user.uid,
        userEmail: user.email,
        type: 'suggestion',
        subject: `In-app feedback (${rating}/5)`,
        description: comment || `Rated ${rating}/5 stars`,
        rating,
      });

      await setDoc(doc(db, 'users', user.uid, 'settings', 'feedbackPrompt'), {
        lastShown: serverTimestamp(),
        completedAt: serverTimestamp(),
        dismissCount: 0,
      }, { merge: true });

      localStorage.setItem('fb_chats_since_show', '0');
      toast.success('Thank you for your feedback!');
      setOpen(false);
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleDismiss}>
      <ModalDialog
        variant="outlined"
        sx={{ maxWidth: 400, width: '100%', borderRadius: 'lg', p: 3 }}
      >
        {/* Close button */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="sm" variant="plain" color="neutral" onClick={handleDismiss}>
            <X size={18} />
          </IconButton>
        </Box>

        <Stack spacing={2.5} alignItems="center">
          {/* Icon */}
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: 'primary.softBg', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={24} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>

          {/* Title */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography level="title-lg" fontWeight={700}>How&apos;s your experience?</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Your feedback helps us improve Flowbooks
            </Typography>
          </Box>

          {/* Star Rating */}
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {[1, 2, 3, 4, 5].map(star => (
              <IconButton
                key={star}
                variant="plain"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                sx={{
                  p: 0.75,
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'scale(1.15)', bgcolor: 'transparent' },
                }}
              >
                <Star
                  size={32}
                  fill={(hoveredStar || rating) >= star ? 'var(--joy-palette-warning-400)' : 'none'}
                  color={(hoveredStar || rating) >= star ? 'var(--joy-palette-warning-400)' : 'var(--joy-palette-neutral-300)'}
                  style={{ transition: 'all 0.15s' }}
                />
              </IconButton>
            ))}
          </Stack>

          {/* Rating label */}
          {rating > 0 && (
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Great'}
              {rating === 5 && 'Excellent!'}
            </Typography>
          )}

          {/* Optional Comment */}
          <Textarea
            placeholder="Tell us more (optional)..."
            minRows={2}
            maxRows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ width: '100%' }}
          />

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
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
              onClick={handleSubmit}
              loading={submitting}
              endDecorator={<Send size={14} />}
              sx={{ flex: 1 }}
            >
              Submit
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
