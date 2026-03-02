'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Skeleton, Select, Option,
} from '@mui/joy';
import {
  UserPlus, CreditCard, HelpCircle, MessageSquare, Mail, Coins,
  Activity, Inbox, Filter, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

const ACTIVITY_TYPES = [
  { value: 'signup', label: 'Signups', icon: UserPlus, color: '#D97757' },
  { value: 'subscription', label: 'Subscriptions', icon: CreditCard, color: 'var(--joy-palette-success-500)' },
  { value: 'support', label: 'Support Tickets', icon: HelpCircle, color: 'var(--joy-palette-warning-500)' },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'var(--joy-palette-primary-500)' },
  { value: 'email', label: 'Emails Sent', icon: Mail, color: 'var(--joy-palette-neutral-600)' },
  { value: 'token_grant', label: 'Message Grants', icon: Coins, color: 'var(--joy-palette-danger-500)' },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; chipColor: 'primary' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
  signup: { icon: UserPlus, color: '#D97757', chipColor: 'warning' },
  subscription: { icon: CreditCard, color: 'var(--joy-palette-success-500)', chipColor: 'success' },
  support: { icon: HelpCircle, color: 'var(--joy-palette-warning-500)', chipColor: 'warning' },
  feedback: { icon: MessageSquare, color: 'var(--joy-palette-primary-500)', chipColor: 'primary' },
  email: { icon: Mail, color: 'var(--joy-palette-neutral-600)', chipColor: 'neutral' },
  token_grant: { icon: Coins, color: 'var(--joy-palette-danger-500)', chipColor: 'danger' },
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      const res = await adminFetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {
      toast.error('Failed to fetch activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [typeFilter]);

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getRelativeTime = (ts: any) => {
    if (!ts) return '';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(ts);
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Activity size={22} style={{ color: '#D97757' }} />
            <Typography level="h3" fontWeight={700}>Activity Log</Typography>
          </Stack>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Real-time feed of platform activity across all users.
          </Typography>
        </Box>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filter</Typography>
              </Stack>
              <Select
                size="sm"
                placeholder="All Activity"
                value={typeFilter || null}
                onChange={(_, val) => setTypeFilter(val || '')}
                sx={{ minWidth: 170, fontSize: '12px' }}
              >
                <Option value="">All Activity</Option>
                {ACTIVITY_TYPES.map(t => (
                  <Option key={t.value} value={t.value}>{t.label}</Option>
                ))}
              </Select>
              {typeFilter && (
                <Chip
                  size="sm"
                  variant="soft"
                  color="neutral"
                  sx={{ fontSize: '10px', cursor: 'pointer' }}
                  onClick={() => setTypeFilter('')}
                >
                  Clear filter
                </Chip>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Activity timeline */}
        {loading ? (
          <Stack spacing={0}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Stack key={i} direction="row" spacing={2} sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="65%" />
                  <Skeleton variant="text" width="40%" sx={{ mt: 0.5 }} />
                  <Skeleton variant="text" width={100} sx={{ mt: 0.5 }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : activities.length === 0 ? (
          <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No activity found.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
            <CardContent sx={{ p: 0 }}>
              <Stack spacing={0}>
                {activities.map((activity, idx) => {
                  const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.email;
                  const Icon = config.icon;
                  const isLast = idx === activities.length - 1;

                  return (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        px: 2.5,
                        py: 2,
                        borderBottom: isLast ? 'none' : '1px solid',
                        borderColor: 'divider',
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: 'background.level1' },
                      }}
                    >
                      {/* Timeline icon */}
                      <Box sx={{ position: 'relative', flexShrink: 0, pt: 0.25 }}>
                        <Box sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: `${config.chipColor}.softBg`,
                          color: config.color,
                        }}>
                          <Icon size={16} />
                        </Box>
                        {/* Vertical connector line */}
                        {!isLast && (
                          <Box sx={{
                            position: 'absolute',
                            left: '50%',
                            top: 40,
                            bottom: -16,
                            width: 1,
                            bgcolor: 'divider',
                            transform: 'translateX(-50%)',
                          }} />
                        )}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                          <Typography level="body-sm" fontWeight={500} sx={{ flex: 1 }}>
                            {activity.description}
                          </Typography>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={config.chipColor}
                            sx={{ fontSize: '10px', flexShrink: 0 }}
                          >
                            {activity.type.replace(/_/g, ' ')}
                          </Chip>
                        </Stack>

                        {activity.userEmail && (
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {activity.userEmail}
                            {activity.userName ? ` (${activity.userName})` : ''}
                          </Typography>
                        )}

                        {/* Meta info */}
                        {activity.meta && (
                          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                            {activity.meta.status && (
                              <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '9px' }}>
                                {activity.meta.status}
                              </Chip>
                            )}
                            {activity.meta.priority && (
                              <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '9px' }}>
                                {activity.meta.priority}
                              </Chip>
                            )}
                            {activity.meta.planId && (
                              <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '9px' }}>
                                {activity.meta.planId}
                              </Chip>
                            )}
                            {activity.meta.amount && (
                              <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '9px' }}>
                                {Number(activity.meta.amount).toLocaleString()} messages
                              </Chip>
                            )}
                            {activity.meta.rating && (
                              <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '9px' }}>
                                Rating: {activity.meta.rating}/5
                              </Chip>
                            )}
                          </Stack>
                        )}

                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                          <Clock size={10} style={{ color: 'var(--joy-palette-neutral-400)' }} />
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            {getRelativeTime(activity.timestamp)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
