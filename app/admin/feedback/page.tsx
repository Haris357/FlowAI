'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton, Switch, Tab, TabList, TabPanel, Tabs,
} from '@mui/joy';
import { MessageSquare, Star, CheckCircle, Inbox, ThumbsDown, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

const TYPE_COLORS: Record<string, 'primary' | 'success' | 'danger' | 'warning'> = {
  suggestion: 'primary', praise: 'success', complaint: 'danger', bug_report: 'warning',
};
const STATUS_COLORS: Record<string, 'warning' | 'primary' | 'success'> = {
  new: 'warning', reviewed: 'primary', acknowledged: 'success',
};

const formatDate = (ts: any) => {
  if (!ts) return '-';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [chatFeedbackList, setChatFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [promptEnabled, setPromptEnabled] = useState(true);
  const [togglingPrompt, setTogglingPrompt] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/feedback')
      .then(res => res.json())
      .then(d => setFeedbackList(d.feedback || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    adminFetch('/api/admin/feedback/settings')
      .then(res => res.json())
      .then(d => setPromptEnabled(d.settings?.enabled !== false))
      .catch(() => {});

    adminFetch('/api/admin/chat-feedback')
      .then(res => res.json())
      .then(d => setChatFeedbackList(d.feedback || []))
      .catch(console.error)
      .finally(() => setChatLoading(false));
  }, []);

  const toggleFeedbackPrompt = async () => {
    setTogglingPrompt(true);
    try {
      const res = await adminFetch('/api/admin/feedback/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !promptEnabled }),
      });
      if (res.ok) {
        setPromptEnabled(prev => !prev);
        toast.success(promptEnabled ? 'Feedback prompt disabled' : 'Feedback prompt enabled');
      }
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setTogglingPrompt(false);
    }
  };

  const handleUpdate = async (feedbackId: string, status: string) => {
    setUpdating(feedbackId);
    try {
      const res = await adminFetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Feedback updated');
      setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, status } : f));
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>Feedback</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Review user feedback and AI chat ratings.
          </Typography>
        </Box>

        <Tabs defaultValue={0}>
          <TabList>
            <Tab>User Feedback</Tab>
            <Tab>AI Chat Feedback</Tab>
          </TabList>

          {/* ── User Feedback tab ── */}
          <TabPanel value={0}>
            <Stack spacing={2} sx={{ pt: 2 }}>
              {/* Feedback Prompt Settings */}
              <Card sx={{ ...adminCard as Record<string, unknown> }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography level="body-sm" fontWeight={700}>In-App Feedback Prompt</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        Periodically ask users to rate their experience
                      </Typography>
                    </Box>
                    <Switch
                      checked={promptEnabled}
                      onChange={toggleFeedbackPrompt}
                      disabled={togglingPrompt}
                      color="primary"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {loading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3].map(i => (
                    <Card key={i} variant="outlined">
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Skeleton variant="text" width="35%" />
                              <Skeleton variant="rectangular" width={55} height={18} sx={{ borderRadius: 10 }} />
                            </Stack>
                            <Skeleton variant="text" width="70%" sx={{ mt: 0.5 }} />
                            <Skeleton variant="text" width={120} sx={{ mt: 0.5 }} />
                          </Box>
                          <Skeleton variant="rectangular" width={65} height={22} sx={{ borderRadius: 10 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : feedbackList.length === 0 ? (
                <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
                  <CardContent sx={{ py: 6, textAlign: 'center' }}>
                    <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No feedback yet.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {feedbackList.map(fb => (
                    <Card key={fb.id} sx={{
                      ...adminCard as Record<string, unknown>,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'neutral.400' },
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography level="body-sm" fontWeight={600}>{fb.subject}</Typography>
                              <Chip size="sm" variant="soft" color={TYPE_COLORS[fb.type] || 'neutral'} sx={{ fontSize: '10px' }}>
                                {fb.type?.replace(/_/g, ' ')}
                              </Chip>
                              {fb.rating && (
                                <Stack direction="row" spacing={0.25}>
                                  {Array.from({ length: fb.rating }).map((_, i) => (
                                    <Star key={i} size={10} fill="var(--joy-palette-warning-400)" color="var(--joy-palette-warning-400)" />
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                            <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>
                              {fb.description?.slice(0, 200)}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.75 }}>
                              {fb.userEmail} &bull; {formatDate(fb.createdAt)}
                            </Typography>
                          </Box>
                          <Stack spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                            <Chip size="sm" variant="soft" color={STATUS_COLORS[fb.status] || 'neutral'} sx={{ fontSize: '10px' }}>
                              {fb.status}
                            </Chip>
                            {fb.status === 'new' && (
                              <Button size="sm" variant="soft" color="success"
                                startDecorator={<CheckCircle size={12} />}
                                onClick={() => handleUpdate(fb.id, 'acknowledged')}
                                loading={updating === fb.id}
                                sx={{ fontSize: '11px' }}>
                                Acknowledge
                              </Button>
                            )}
                          </Stack>
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
            </Stack>
          </TabPanel>

          {/* ── AI Chat Feedback tab ── */}
          <TabPanel value={1}>
            <Stack spacing={2} sx={{ pt: 2 }}>
              {chatLoading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3].map(i => (
                    <Card key={i} variant="outlined">
                      <CardContent sx={{ p: 2.5 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="90%" sx={{ mt: 0.5 }} />
                        <Skeleton variant="text" width={140} sx={{ mt: 0.5 }} />
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : chatFeedbackList.length === 0 ? (
                <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
                  <CardContent sx={{ py: 6, textAlign: 'center' }}>
                    <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No chat feedback yet.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {chatFeedbackList.map(fb => (
                    <Card key={fb.id} sx={{
                      ...adminCard as Record<string, unknown>,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'neutral.400' },
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                            {fb.rating === 'like' ? (
                              <ThumbsUp size={16} fill="var(--joy-palette-success-500)" color="var(--joy-palette-success-500)" />
                            ) : (
                              <ThumbsDown size={16} fill="var(--joy-palette-danger-500)" color="var(--joy-palette-danger-500)" />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {fb.userMessage && (
                              <Box sx={{ p: 1.25, borderRadius: 'sm', bgcolor: 'background.level2', mb: 0.75 }}>
                                <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.tertiary', mb: 0.25 }}>User asked:</Typography>
                                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                  {fb.userMessage.slice(0, 300)}{fb.userMessage.length > 300 ? '...' : ''}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ p: 1.25, borderRadius: 'sm', bgcolor: 'background.level1', mb: 0.75 }}>
                              <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.tertiary', mb: 0.25 }}>AI responded:</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                {fb.aiResponse?.slice(0, 300)}{fb.aiResponse?.length > 300 ? '...' : ''}
                              </Typography>
                            </Box>
                            {fb.complaint && (
                              <Typography level="body-sm" sx={{ mb: 0.5, color: 'danger.600', fontStyle: 'italic' }}>
                                "{fb.complaint}"
                              </Typography>
                            )}
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              {fb.userId} &bull; {formatDate(fb.createdAt)}
                            </Typography>
                          </Box>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={fb.rating === 'like' ? 'success' : 'danger'}
                            sx={{ fontSize: '10px', flexShrink: 0 }}
                          >
                            {fb.rating}
                          </Chip>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </TabPanel>
        </Tabs>
      </Stack>
    </Box>
  );
}
