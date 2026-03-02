'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Button, Input, Textarea,
  Select, Option, Modal, ModalDialog, ModalClose, Chip, Skeleton,
  FormControl, FormLabel, Divider, CircularProgress,
} from '@mui/joy';
import {
  Newspaper, Sparkles, Send, Eye, Clock, Users, CheckCircle,
  AlertTriangle, Plus, Trash2, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

interface NewsletterSection {
  heading: string;
  body: string;
}

interface Newsletter {
  id: string;
  title: string;
  sections: NewsletterSection[];
  footerNote: string;
  recipients: string;
  sent: number;
  failed: number;
  total: number;
  createdAt: any;
  automated?: boolean;
}

export default function AdminNewsletterPage() {
  // Generation form
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional yet friendly');
  const [sectionCount, setSectionCount] = useState(3);
  const [generating, setGenerating] = useState(false);

  // Editor
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<NewsletterSection[]>([]);
  const [footerNote, setFooterNote] = useState('');
  const [recipients, setRecipients] = useState<'all' | 'free' | 'pro' | 'max'>('all');

  // Sending
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  // History
  const [history, setHistory] = useState<Newsletter[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/newsletter')
      .then(res => res.json())
      .then(d => setHistory(d.newsletters || []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setSendResult(null);
    try {
      const res = await adminFetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: topic || undefined,
          tone,
          sections: sectionCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const gen = data.generated;
      setTitle(gen.title);
      setSections(gen.sections);
      setFooterNote(gen.footerNote || '');
      toast.success('Newsletter generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate newsletter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          title,
          sections,
          footerNote,
          recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');

      setSendResult({ sent: data.sent, failed: data.failed, total: data.total });
      toast.success(`Newsletter sent to ${data.sent} user(s)`);

      // Refresh history
      adminFetch('/api/admin/newsletter')
        .then(r => r.json())
        .then(d => setHistory(d.newsletters || []))
        .catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  const updateSection = (index: number, field: 'heading' | 'body', value: string) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    setSections(prev => [...prev, { heading: '', body: '' }]);
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const recipientLabel: Record<string, string> = { all: 'All Users', free: 'Free Users', pro: 'Pro Users', max: 'Max Users' };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography level="h3" fontWeight={700}>Newsletter</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Generate AI-powered newsletters and send them to your users.
          </Typography>
        </Box>

        {/* Auto-Newsletter Status Banner */}
        <Card sx={{ ...liquidGlassSubtle as Record<string, unknown>, borderLeft: '3px solid', borderLeftColor: 'success.400' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Zap size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
              <Box sx={{ flex: 1 }}>
                <Typography level="body-sm" fontWeight={600}>
                  Auto-Newsletter: <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '10px', ml: 0.5 }}>Active</Chip>
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  AI-generated newsletters are sent automatically every Monday at 9:00 AM ET to opted-in users.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* AI Generation Card */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Sparkles size={16} style={{ color: 'var(--joy-palette-warning-600)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>AI Newsletter Generator</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Describe your topic and let AI create the content.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Topic / Theme</FormLabel>
                <Textarea
                  placeholder="e.g., New invoice templates, tax season tips, feature update announcements..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  minRows={2}
                  maxRows={4}
                />
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Tone</FormLabel>
                  <Select value={tone} onChange={(_, v) => v && setTone(v)}>
                    <Option value="professional yet friendly">Professional & Friendly</Option>
                    <Option value="casual and upbeat">Casual & Upbeat</Option>
                    <Option value="formal and informative">Formal & Informative</Option>
                    <Option value="inspiring and motivational">Inspiring & Motivational</Option>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Sections</FormLabel>
                  <Select value={sectionCount} onChange={(_, v) => v && setSectionCount(v)}>
                    <Option value={2}>2 sections</Option>
                    <Option value={3}>3 sections</Option>
                    <Option value={4}>4 sections</Option>
                    <Option value={5}>5 sections</Option>
                  </Select>
                </FormControl>
              </Stack>

              <Button
                variant="solid"
                color="warning"
                startDecorator={generating ? <CircularProgress size="sm" /> : <Sparkles size={16} />}
                onClick={handleGenerate}
                loading={generating}
                disabled={generating}
                sx={{ alignSelf: 'flex-start' }}
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Editor Card */}
        {(title || sections.length > 0) && (
          <Card sx={{ ...adminCard as Record<string, unknown> }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Newspaper size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                </Box>
                <Typography level="title-md" fontWeight={700}>Edit Newsletter</Typography>
              </Stack>

              <Stack spacing={2.5}>
                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Newsletter title"
                  />
                </FormControl>

                {sections.map((section, idx) => (
                  <Card key={idx} sx={{ ...liquidGlassSubtle as Record<string, unknown>, p: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography level="body-xs" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                          Section {idx + 1}
                        </Typography>
                        {sections.length > 1 && (
                          <Button
                            size="sm"
                            variant="plain"
                            color="danger"
                            onClick={() => removeSection(idx)}
                            sx={{ minHeight: 'auto', p: 0.5 }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </Stack>
                      <Input
                        value={section.heading}
                        onChange={e => updateSection(idx, 'heading', e.target.value)}
                        placeholder="Section heading"
                        size="sm"
                      />
                      <Textarea
                        value={section.body}
                        onChange={e => updateSection(idx, 'body', e.target.value)}
                        placeholder="Section content..."
                        minRows={3}
                        maxRows={8}
                        size="sm"
                      />
                    </Stack>
                  </Card>
                ))}

                <Button
                  variant="soft"
                  color="neutral"
                  size="sm"
                  startDecorator={<Plus size={14} />}
                  onClick={addSection}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add Section
                </Button>

                <FormControl>
                  <FormLabel>Footer Note (optional)</FormLabel>
                  <Input
                    value={footerNote}
                    onChange={e => setFooterNote(e.target.value)}
                    placeholder="A closing tip or call-to-action..."
                  />
                </FormControl>

                <Divider />

                {/* Recipients + Actions */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Recipients</FormLabel>
                    <Select value={recipients} onChange={(_, v) => v && setRecipients(v as any)}>
                      <Option value="all">All Users</Option>
                      <Option value="free">Free Users Only</Option>
                      <Option value="pro">Pro Users Only</Option>
                      <Option value="max">Max Users Only</Option>
                    </Select>
                  </FormControl>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="soft"
                      color="neutral"
                      startDecorator={<Eye size={16} />}
                      onClick={() => setPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="solid"
                      color="primary"
                      startDecorator={sending ? <CircularProgress size="sm" /> : <Send size={16} />}
                      onClick={() => setConfirmOpen(true)}
                      disabled={!title || sections.length === 0 || sending}
                      loading={sending}
                    >
                      Send Newsletter
                    </Button>
                  </Stack>
                </Stack>

                {/* Send Result */}
                {sendResult && (
                  <Card variant="soft" color={sendResult.failed > 0 ? 'warning' : 'success'} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CheckCircle size={18} />
                      <Typography level="body-sm" fontWeight={600}>
                        Sent: {sendResult.sent} / {sendResult.total}
                        {sendResult.failed > 0 && ` (${sendResult.failed} failed)`}
                      </Typography>
                    </Stack>
                  </Card>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Past Newsletters */}
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Clock size={18} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
            <Typography level="title-md" fontWeight={700}>Sent Newsletters</Typography>
          </Stack>

          {loadingHistory ? (
            <Stack spacing={1.5}>
              {[1, 2, 3].map(i => (
                <Card key={i} variant="outlined">
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="60%" sx={{ mt: 0.5 }} />
                      </Box>
                      <Skeleton variant="rectangular" width={65} height={22} sx={{ borderRadius: 10 }} />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : history.length === 0 ? (
            <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
              <CardContent sx={{ py: 5, textAlign: 'center' }}>
                <Newspaper size={32} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
                <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                  No newsletters sent yet. Generate your first one above.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {history.map(nl => (
                <Card key={nl.id} sx={{
                  ...adminCard as Record<string, unknown>,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'neutral.400' },
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        <Typography level="body-sm" fontWeight={600}>{nl.title}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {nl.sections?.length || 0} sections &bull; Sent to {recipientLabel[nl.recipients] || nl.recipients}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                          {formatDate(nl.createdAt)}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} alignItems="flex-end">
                        {nl.automated && (
                          <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '10px' }}
                            startDecorator={<Zap size={10} />}>
                            Automated
                          </Chip>
                        )}
                        <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '10px' }}>
                          {nl.sent} sent
                        </Chip>
                        {nl.failed > 0 && (
                          <Chip size="sm" variant="soft" color="danger" sx={{ fontSize: '10px' }}>
                            {nl.failed} failed
                          </Chip>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <ModalDialog sx={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
          <ModalClose />
          <Typography level="title-lg" fontWeight={700}>Newsletter Preview</Typography>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: 'md' }}>
            <Typography level="body-xs" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.tertiary', mb: 0.5 }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography level="h4" sx={{ color: 'primary.600', mb: 2 }}>{title}</Typography>
            {sections.map((s, i) => (
              <Card key={i} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Typography level="title-sm" fontWeight={700} sx={{ mb: 1 }}>{s.heading}</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{s.body}</Typography>
              </Card>
            ))}
            {footerNote && (
              <Card variant="soft" color="warning" sx={{ p: 1.5 }}>
                <Typography level="body-xs" sx={{ color: 'warning.700' }}>{footerNote}</Typography>
              </Card>
            )}
          </Box>
        </ModalDialog>
      </Modal>

      {/* Confirm Send Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <ModalDialog sx={{ maxWidth: 440 }}>
          <ModalClose />
          <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 1 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-lg" fontWeight={700}>Send Newsletter?</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              This will send &ldquo;{title}&rdquo; to <strong>{recipientLabel[recipients]}</strong>.
              This action cannot be undone.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
              <Button
                variant="soft"
                color="neutral"
                onClick={() => setConfirmOpen(false)}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Send size={16} />}
                onClick={handleSend}
                sx={{ flex: 1 }}
              >
                Send Now
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
