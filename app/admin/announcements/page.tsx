'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Input,
  Textarea, FormControl, FormLabel, Select, Option, Checkbox, Skeleton,
  Divider, RadioGroup, Radio, Sheet,
} from '@mui/joy';
import { Megaphone, Send, Inbox, Users, Mail, Info, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

type AnnouncementType = 'info' | 'warning' | 'success' | 'action';
type TargetAudience = 'all' | 'free_users' | 'pro_users' | 'max_users';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  target: TargetAudience;
  actionUrl?: string;
  sendEmail: boolean;
  recipientCount: number;
  createdAt: any;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: 'primary' | 'warning' | 'success' | 'danger'; icon: typeof Info }> = {
  info: { label: 'Info', color: 'primary', icon: Info },
  warning: { label: 'Warning', color: 'warning', icon: AlertTriangle },
  success: { label: 'Success', color: 'success', icon: CheckCircle },
  action: { label: 'Action', color: 'danger', icon: Zap },
};

const TARGET_LABELS: Record<TargetAudience, string> = {
  all: 'All Users',
  free_users: 'Free Users',
  pro_users: 'Pro Users',
  max_users: 'Max Users',
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [target, setTarget] = useState<TargetAudience>('all');
  const [actionUrl, setActionUrl] = useState('');
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements')
      .then(res => res.json())
      .then(d => setAnnouncements(d.announcements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setTarget('all');
    setActionUrl('');
    setSendEmail(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          target,
          actionUrl: actionUrl.trim() || undefined,
          sendEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send announcement');
      }

      const data = await res.json();
      toast.success(`Announcement sent to ${data.recipientCount} user${data.recipientCount !== 1 ? 's' : ''}`);
      resetForm();
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Megaphone size={22} style={{ color: '#D97757' }} />
            <Typography level="h3" fontWeight={700}>Announcements</Typography>
          </Stack>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Create and send announcements to all users or specific segments.
          </Typography>
        </Box>

        {/* Create Announcement Form */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Typography level="title-md" fontWeight={700} sx={{ mb: 2 }}>
              New Announcement
            </Typography>

            <Stack spacing={2.5}>
              {/* Title */}
              <FormControl required>
                <FormLabel>Title</FormLabel>
                <Input
                  size="sm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. New feature: Recurring invoices"
                />
              </FormControl>

              {/* Message */}
              <FormControl required>
                <FormLabel>Message</FormLabel>
                <Textarea
                  minRows={3}
                  maxRows={8}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your announcement message..."
                />
              </FormControl>

              {/* Type */}
              <FormControl>
                <FormLabel>Type</FormLabel>
                <RadioGroup
                  orientation="horizontal"
                  value={type}
                  onChange={e => setType(e.target.value as AnnouncementType)}
                  sx={{ gap: 2 }}
                >
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <Sheet
                        key={t}
                        variant={type === t ? 'soft' : 'outlined'}
                        sx={{
                          px: 2, py: 1, borderRadius: 'sm', display: 'flex',
                          alignItems: 'center', gap: 1, cursor: 'pointer',
                          borderColor: type === t ? `${cfg.color}.400` : undefined,
                        }}
                      >
                        <Radio
                          value={t}
                          label={
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Icon size={14} />
                              <Typography level="body-sm">{cfg.label}</Typography>
                            </Stack>
                          }
                          variant="plain"
                          sx={{ flexGrow: 0 }}
                        />
                      </Sheet>
                    );
                  })}
                </RadioGroup>
              </FormControl>

              {/* Target Audience & Action URL */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Target Audience</FormLabel>
                  <Select
                    size="sm"
                    value={target}
                    onChange={(_, val) => val && setTarget(val as TargetAudience)}
                    startDecorator={<Users size={14} />}
                  >
                    <Option value="all">All Users</Option>
                    <Option value="free_users">Free Users</Option>
                    <Option value="pro_users">Pro Users</Option>
                    <Option value="max_users">Max Users</Option>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Action URL (optional)</FormLabel>
                  <Input
                    size="sm"
                    value={actionUrl}
                    onChange={e => setActionUrl(e.target.value)}
                    placeholder="/settings/billing or https://..."
                  />
                </FormControl>
              </Stack>

              {/* Send Email Checkbox */}
              <Checkbox
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Mail size={14} />
                    <Typography level="body-sm">Also send via email</Typography>
                  </Stack>
                }
                size="sm"
              />

              <Divider />

              {/* Send Button */}
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  startDecorator={<Send size={14} />}
                  loading={sending}
                  onClick={handleSend}
                  sx={{
                    background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #C4694D 0%, #B35E44 100%)' },
                  }}
                >
                  Send Announcement
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Past Announcements */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Typography level="title-md" fontWeight={700} sx={{ mb: 2 }}>
              Past Announcements
            </Typography>

            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3].map(i => (
                  <Card key={i} variant="soft">
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="45%" sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="75%" />
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Skeleton variant="rectangular" width={55} height={18} sx={{ borderRadius: 10 }} />
                            <Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} />
                            <Skeleton variant="text" width={100} />
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : announcements.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
                <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                  No announcements sent yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {announcements.map(ann => {
                  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <Card key={ann.id} variant="soft" sx={{
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'neutral.400' },
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Icon size={14} style={{ flexShrink: 0 }} />
                              <Typography level="body-sm" fontWeight={600}>{ann.title}</Typography>
                            </Stack>
                            <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>
                              {ann.message.slice(0, 200)}{ann.message.length > 200 ? '...' : ''}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                {formatDate(ann.createdAt)}
                              </Typography>
                              <Chip size="sm" variant="soft" color={cfg.color} sx={{ fontSize: '10px' }}>
                                {cfg.label}
                              </Chip>
                              <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px' }}>
                                {TARGET_LABELS[ann.target] || ann.target}
                              </Chip>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                {ann.recipientCount} recipient{ann.recipientCount !== 1 ? 's' : ''}
                              </Typography>
                              {ann.sendEmail && (
                                <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}
                                  startDecorator={<Mail size={10} />}>
                                  Email
                                </Chip>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
