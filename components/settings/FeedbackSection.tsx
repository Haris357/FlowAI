'use client';
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, FormControl, FormLabel,
  Input, Textarea, Select, Option, Button, Chip, IconButton, Skeleton,
} from '@mui/joy';
import { Send, MessageSquare, Star, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createFeedback, getUserFeedback } from '@/services/support';
import type { Feedback, FeedbackType } from '@/types/support';
import { Timestamp } from 'firebase/firestore';

const TYPE_COLORS: Record<string, 'primary' | 'success' | 'danger' | 'warning'> = {
  suggestion: 'primary', praise: 'success', complaint: 'danger', bug_report: 'warning',
};

export default function FeedbackSection() {
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingFeedback(true);
    getUserFeedback(user.uid).then(setFeedbackList).catch(console.error).finally(() => setLoadingFeedback(false));
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!subject.trim() || !description.trim()) { toast.error('Please fill in subject and description'); return; }
    setSubmitting(true);
    try {
      await createFeedback({
        userId: user.uid, userEmail: user.email || '', type,
        subject: subject.trim(), description: description.trim(),
        ...(rating > 0 && { rating }),
      });
      toast.success('Feedback submitted! Thank you.');
      setSubject(''); setDescription(''); setType('suggestion'); setRating(0);
      const updated = await getUserFeedback(user.uid);
      setFeedbackList(updated);
    } catch { toast.error('Failed to submit feedback'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (ts: Timestamp | any) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Stack spacing={3}>
      {/* Feedback Form */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>Submit Feedback</Typography>
          </Stack>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select value={type} onChange={(_, v) => v && setType(v)}>
                <Option value="suggestion">Suggestion</Option>
                <Option value="praise">Praise</Option>
                <Option value="complaint">Complaint</Option>
                <Option value="bug_report">Bug Report</Option>
              </Select>
            </FormControl>
            <FormControl required>
              <FormLabel>Subject</FormLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's your feedback about?" />
            </FormControl>
            <FormControl required>
              <FormLabel>Description</FormLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more..." minRows={4} />
            </FormControl>
            <FormControl>
              <FormLabel>Rating (optional)</FormLabel>
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3, 4, 5].map(n => (
                  <IconButton key={n} size="sm" variant="plain" onClick={() => setRating(n === rating ? 0 : n)}
                    sx={{ color: n <= rating ? 'warning.400' : 'neutral.300' }}>
                    <Star size={22} fill={n <= rating ? 'currentColor' : 'none'} />
                  </IconButton>
                ))}
              </Stack>
            </FormControl>
            <Box>
              <Button startDecorator={<Send size={16} />} onClick={handleSubmit} loading={submitting}>
                Submit Feedback
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* History */}
      <Box>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 1.5 }}>Your Feedback</Typography>
        {loadingFeedback ? (
          <Stack spacing={1.5}>
            {[1, 2].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant="text" width="45%" sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="75%" />
                  <Skeleton variant="text" width={80} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : feedbackList.length === 0 ? (
          <Card variant="soft">
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Inbox size={32} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No feedback submitted yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {feedbackList.map(fb => (
              <Card key={fb.id} variant="outlined" sx={{ transition: 'border-color 0.2s', '&:hover': { borderColor: 'neutral.400' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography level="body-sm" fontWeight={600}>{fb.subject}</Typography>
                        {fb.rating && (
                          <Stack direction="row" spacing={0.25}>
                            {Array.from({ length: fb.rating }).map((_, i) => (
                              <Star key={i} size={10} fill="var(--joy-palette-warning-400)" color="var(--joy-palette-warning-400)" />
                            ))}
                          </Stack>
                        )}
                      </Stack>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }} noWrap>
                        {fb.description.slice(0, 120)}
                      </Typography>
                    </Box>
                    <Chip size="sm" variant="soft" color={TYPE_COLORS[fb.type] || 'neutral'}
                      sx={{ fontSize: '10px', ml: 1, flexShrink: 0 }}>
                      {fb.type.replace(/_/g, ' ')}
                    </Chip>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{formatDate(fb.createdAt)}</Typography>
                    <Chip size="sm" variant="outlined" sx={{ fontSize: '10px' }}>{fb.status}</Chip>
                  </Stack>
                  {fb.adminResponse && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 'sm', bgcolor: 'primary.softBg' }}>
                      <Typography level="body-xs" fontWeight={600} sx={{ color: 'primary.700' }}>Admin Response:</Typography>
                      <Typography level="body-xs" sx={{ color: 'primary.600', mt: 0.25 }}>{fb.adminResponse}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
