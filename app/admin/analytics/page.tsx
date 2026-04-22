'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Skeleton, Select, Option, Table, Sheet,
} from '@mui/joy';
import {
  BarChart3, Users, MessageSquare, UserPlus, TrendingUp, Eye,
  Zap, AlertTriangle, ArrowUpRight, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

interface AnalyticsData {
  period: string;
  overview: {
    totalEvents: number;
    uniqueUsers: number;
    totalSignups: number;
    totalMessages: number;
    returnedUsers: number;
  };
  topEvents: Array<{ event: string; count: number }>;
  dailyActiveUsers: Array<{ date: string; users: number }>;
  signupsPerDay: Array<{ date: string; signups: number }>;
  messagesPerDay: Array<{ date: string; messages: number }>;
  topPages: Array<{ url: string; views: number }>;
  messageLimitHits: Array<{ blockedBy: string; plan: string; hits: number }>;
}

const PERIODS = [
  { value: '1d', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const CHART_COLORS = ['#D97757', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: string | number; color: string; loading: boolean;
}) {
  return (
    <Card sx={{ ...adminCard as Record<string, unknown>, flex: 1, minWidth: 180 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}15`, border: `1px solid ${color}30`,
          }}>
            <Icon size={20} style={{ color }} />
          </Box>
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} />
            ) : (
              <Typography level="h4" fontWeight={700}>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ ...adminCard as Record<string, unknown> }}>
      <CardContent>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 2 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function formatEventName(event: string): string {
  return event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || '');
  } catch {
    return url || '(unknown)';
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  const overview = data?.overview;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BarChart3 size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>
          <Box>
            <Typography level="h3" fontWeight={700}>Analytics</Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
              Product analytics powered by PostHog
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Select
            size="sm"
            value={period}
            onChange={(_, v) => v && setPeriod(v)}
            sx={{ minWidth: 140, ...liquidGlassSubtle as Record<string, unknown> }}
          >
            {PERIODS.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
          </Select>
          <Box
            component="button"
            onClick={fetchAnalytics}
            sx={{
              p: 1, borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'text.secondary',
              '&:hover': { background: 'rgba(0,0,0,0.05)' },
            }}
          >
            <RefreshCw size={16} />
          </Box>
        </Stack>
      </Stack>

      {error && (
        <Card sx={{ mb: 3, p: 2, borderColor: 'danger.300' }}>
          <Typography level="body-sm" color="danger">{error}</Typography>
        </Card>
      )}

      {/* Overview Stats */}
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <StatCard icon={Zap} label="Total Events" value={overview?.totalEvents || 0} color="#D97757" loading={loading} />
        <StatCard icon={Users} label="Active Users" value={overview?.uniqueUsers || 0} color="#3B82F6" loading={loading} />
        <StatCard icon={UserPlus} label="New Signups" value={overview?.totalSignups || 0} color="#10B981" loading={loading} />
        <StatCard icon={MessageSquare} label="AI Messages" value={overview?.totalMessages || 0} color="#8B5CF6" loading={loading} />
        <StatCard icon={TrendingUp} label="Retained Users" value={overview?.returnedUsers || 0} color="#F59E0B" loading={loading} />
      </Stack>

      {/* Charts Row 1 */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 2 }}>
          <ChartCard title="Daily Active Users">
            {loading ? <Skeleton variant="rectangular" height={250} /> : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data?.dailyActiveUsers || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F620" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Box>
        <Box sx={{ flex: 1 }}>
          <ChartCard title="Top Events">
            {loading ? <Skeleton variant="rectangular" height={250} /> : (
              <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                <Stack spacing={1}>
                  {(data?.topEvents || []).map((e, i) => (
                    <Stack key={e.event} direction="row" alignItems="center" spacing={1}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0,
                      }} />
                      <Typography level="body-xs" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatEventName(e.event)}
                      </Typography>
                      <Chip size="sm" variant="soft" sx={{ fontWeight: 700, fontSize: '11px' }}>
                        {e.count.toLocaleString()}
                      </Chip>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </ChartCard>
        </Box>
      </Stack>

      {/* Charts Row 2 */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <ChartCard title="AI Messages Per Day">
            {loading ? <Skeleton variant="rectangular" height={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.messagesPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} />
                  <Bar dataKey="messages" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Box>
        <Box sx={{ flex: 1 }}>
          <ChartCard title="Signups Per Day">
            {loading ? <Skeleton variant="rectangular" height={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.signupsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} />
                  <Bar dataKey="signups" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Box>
      </Stack>

      {/* Row 3: Top Pages + Limit Hits */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
        <Box sx={{ flex: 1 }}>
          <ChartCard title="Top Pages">
            {loading ? <Skeleton variant="rectangular" height={250} /> : (
              <Sheet variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Table size="sm" stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: '70%' }}>Page</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topPages || []).map((p, i) => (
                      <tr key={i}>
                        <td>
                          <Typography level="body-xs" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                            {shortenUrl(p.url)}
                          </Typography>
                        </td>
                        <td><Typography level="body-xs" fontWeight={600}>{p.views.toLocaleString()}</Typography></td>
                      </tr>
                    ))}
                    {(!data?.topPages?.length) && (
                      <tr><td colSpan={2}><Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 2 }}>No data yet</Typography></td></tr>
                    )}
                  </tbody>
                </Table>
              </Sheet>
            )}
          </ChartCard>
        </Box>
        <Box sx={{ flex: 1 }}>
          <ChartCard title="Message Limit Hits">
            {loading ? <Skeleton variant="rectangular" height={250} /> : (
              <>
                {(data?.messageLimitHits?.length || 0) > 0 ? (
                  <Sheet variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <Table size="sm" stickyHeader>
                      <thead>
                        <tr>
                          <th>Blocked By</th>
                          <th>Plan</th>
                          <th>Hits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.messageLimitHits || []).map((h, i) => (
                          <tr key={i}>
                            <td><Chip size="sm" color={h.blockedBy === 'session' ? 'warning' : 'danger'} variant="soft">{h.blockedBy}</Chip></td>
                            <td><Typography level="body-xs">{h.plan || 'free'}</Typography></td>
                            <td><Typography level="body-xs" fontWeight={600}>{h.hits}</Typography></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                ) : (
                  <Stack alignItems="center" spacing={1} sx={{ py: 4, color: 'text.tertiary' }}>
                    <AlertTriangle size={24} />
                    <Typography level="body-sm">No limit hits in this period</Typography>
                  </Stack>
                )}
              </>
            )}
          </ChartCard>
        </Box>
      </Stack>
    </Box>
  );
}
