'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Skeleton, Select, Option,
  Sheet, Table, Button, Input,
} from '@mui/joy';
import {
  UserPlus, CreditCard, HelpCircle, MessageSquare, Mail, Coins,
  Activity, Inbox, Filter, Clock, Search, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

const ACTIVITY_TYPES = [
  { value: 'signup', label: 'Signups', icon: UserPlus },
  { value: 'subscription', label: 'Subscriptions', icon: CreditCard },
  { value: 'support', label: 'Support Tickets', icon: HelpCircle },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
  { value: 'email', label: 'Emails Sent', icon: Mail },
  { value: 'token_grant', label: 'Message Grants', icon: Coins },
];

type ChipColor = 'primary' | 'success' | 'warning' | 'neutral' | 'danger';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; chipColor: ChipColor; label: string }> = {
  signup:       { icon: UserPlus,      chipColor: 'warning', label: 'Signup' },
  subscription: { icon: CreditCard,    chipColor: 'success', label: 'Subscription' },
  support:      { icon: HelpCircle,    chipColor: 'warning', label: 'Support' },
  feedback:     { icon: MessageSquare, chipColor: 'primary', label: 'Feedback' },
  email:        { icon: Mail,          chipColor: 'neutral', label: 'Email' },
  token_grant:  { icon: Coins,         chipColor: 'danger',  label: 'Grant' },
};

function parseTimestamp(ts: any): Date | null {
  if (!ts) return null;
  if (ts._seconds) return new Date(ts._seconds * 1000);
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
}

function formatDate(ts: any): string {
  const d = parseTimestamp(ts);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getRelativeTime(ts: any): string {
  const d = parseTimestamp(ts);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMs < 0) return 'just now';
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '500');
      const res = await adminFetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setActivities(data.activities || []);
    } catch {
      toast.error('Failed to fetch activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.toLowerCase();
    return activities.filter(a =>
      (a.description || '').toLowerCase().includes(q) ||
      (a.userEmail || '').toLowerCase().includes(q) ||
      (a.userName || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q)
    );
  }, [activities, search]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageRows = filtered.slice(startIdx, endIdx);

  const renderMeta = (meta: any) => {
    if (!meta) return null;
    const chips: React.ReactNode[] = [];
    if (meta.status) chips.push(
      <Chip key="s" size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
        {meta.status}
      </Chip>
    );
    if (meta.priority) chips.push(
      <Chip key="p" size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
        {meta.priority}
      </Chip>
    );
    if (meta.planId) chips.push(
      <Chip key="pl" size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
        {meta.planId}
      </Chip>
    );
    if (meta.amount) chips.push(
      <Chip key="a" size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
        {Number(meta.amount).toLocaleString()} msgs
      </Chip>
    );
    if (meta.rating) chips.push(
      <Chip key="r" size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
        {meta.rating}/5
      </Chip>
    );
    if (chips.length === 0) return null;
    return <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{chips}</Stack>;
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Activity size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Activity Log</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Real-time feed of platform activity across all users.
              </Typography>
            </Box>
          </Stack>
          <Button
            size="sm"
            variant="outlined"
            color="neutral"
            startDecorator={<RefreshCw size={14} />}
            onClick={fetchActivities}
            loading={loading}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filter</Typography>
              </Stack>

              <Select
                size="sm"
                placeholder="All Activity"
                value={typeFilter || ''}
                onChange={(_, val) => setTypeFilter(val || '')}
                sx={{ minWidth: 180, borderRadius: '8px' }}
              >
                <Option value="">All Activity</Option>
                {ACTIVITY_TYPES.map(t => (
                  <Option key={t.value} value={t.value}>{t.label}</Option>
                ))}
              </Select>

              <Input
                size="sm"
                placeholder="Search description, user…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 200, borderRadius: '8px' }}
              />

              {(typeFilter || search) && (
                <Chip
                  size="sm"
                  variant="soft"
                  color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setTypeFilter(''); setSearch(''); }}
                >
                  Clear filters
                </Chip>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table
              hoverRow
              stickyHeader
              sx={{
                '& thead th': {
                  py: 1.25,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'text.tertiary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  bgcolor: 'background.surface',
                },
                '& tbody td': { py: 1.5, verticalAlign: 'middle' },
                '--TableCell-paddingX': '16px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '9rem' }}>Type</th>
                  <th>Description</th>
                  <th style={{ width: '16rem' }}>User</th>
                  <th style={{ width: '10rem' }}>Meta</th>
                  <th style={{ width: '9rem' }}>When</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="rectangular" width={90} height={22} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="text" width="70%" /></td>
                      <td><Skeleton variant="text" width={60} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || typeFilter ? 'No activity matches your filters.' : 'No activity found.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((a) => {
                    const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.email;
                    const Icon = cfg.icon;
                    return (
                      <tr key={a.id}>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={cfg.chipColor}
                            startDecorator={<Icon size={11} />}
                            sx={{ fontSize: '0.7rem', fontWeight: 600, '--Chip-minHeight': '22px' }}
                          >
                            {cfg.label}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                            {a.description}
                          </Typography>
                        </td>
                        <td>
                          {a.userEmail || a.userName ? (
                            <Box sx={{ minWidth: 0 }}>
                              <Typography level="body-xs" fontWeight={600} noWrap>
                                {a.userName || '—'}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                                {a.userEmail || ''}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>
                          )}
                        </td>
                        <td>{renderMeta(a.meta) || <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>}</td>
                        <td>
                          <Stack spacing={0.25}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Clock size={10} style={{ color: 'var(--joy-palette-neutral-400)' }} />
                              <Typography level="body-xs" fontWeight={500}>
                                {getRelativeTime(a.timestamp)}
                              </Typography>
                            </Stack>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.68rem' }}>
                              {formatDate(a.timestamp)}
                            </Typography>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Sheet>

          {!loading && totalItems > 0 && (
            <PaginationFooter
              startIdx={startIdx} endIdx={endIdx} total={totalItems}
              pageSize={pageSize} setPageSize={setPageSize}
              currentPage={currentPage} totalPages={totalPages} setPage={setPage}
            />
          )}
        </Card>
      </Stack>
    </Box>
  );
}
