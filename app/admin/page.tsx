'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Skeleton, Avatar, Button,
} from '@mui/joy';
import {
  Users, HelpCircle, MessageSquare, CreditCard, ArrowUpRight, Zap,
  TrendingUp, Bell, Mail, UserPlus, ShieldCheck, Activity, Clock,
  LayoutDashboard,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  openTickets: number;
  newFeedback: number;
  totalCompanies: number;
  planDistribution: { free: number; pro: number; max: number };
  recentUsers: Array<{ id: string; name?: string; email?: string; photoURL?: string; createdAt: any }>;
  recentActivity: Array<{ type: string; description: string; timestamp: any }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dist = stats?.planDistribution || { free: 0, pro: 0, max: 0 };
  const total = dist.free + dist.pro + dist.max;
  const revenue = (dist.pro * PLANS.pro.price) + (dist.max * PLANS.max.price);
  const paidUsers = dist.pro + dist.max;

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const QUICK_ACTIONS = [
    { label: 'Manage Users', desc: 'View and manage accounts', href: '/admin/users', icon: Users, color: 'primary' },
    { label: 'Email Center', desc: 'Send template emails', href: '/admin/emails', icon: Mail, color: 'primary' },
    { label: 'Announcements', desc: 'Send platform announcements', href: '/admin/announcements', icon: Bell, color: 'warning' },
    { label: 'Support Tickets', desc: 'Respond to user issues', href: '/admin/support', icon: HelpCircle, color: 'warning' },
    { label: 'User Feedback', desc: 'Review suggestions', href: '/admin/feedback', icon: MessageSquare, color: 'success' },
    { label: 'Subscriptions', desc: 'Revenue & plan analytics', href: '/admin/subscriptions', icon: CreditCard, color: 'primary' },
    { label: 'Notifications', desc: 'Manage user notifications', href: '/admin/notifications', icon: Bell, color: 'neutral' },
    { label: 'Activity Log', desc: 'Platform activity feed', href: '/admin/activity', icon: Activity, color: 'neutral' },
  ];

  const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    signup: { icon: UserPlus, color: 'var(--joy-palette-success-500)' },
    subscription: { icon: CreditCard, color: 'var(--joy-palette-primary-500)' },
    ticket: { icon: HelpCircle, color: 'var(--joy-palette-warning-500)' },
    feedback: { icon: MessageSquare, color: 'var(--joy-palette-neutral-500)' },
    email: { icon: Mail, color: 'var(--joy-palette-primary-500)' },
    announcement: { icon: Bell, color: 'var(--joy-palette-warning-500)' },
    system: { icon: ShieldCheck, color: 'var(--joy-palette-danger-500)' },
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <LayoutDashboard size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>
          <Box>
            <Typography level="h3" fontWeight={700}>Dashboard</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Overview of your Flowbooks platform.
            </Typography>
          </Box>
        </Stack>

        {/* Stat Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <StatCard title="Total Users" value={stats?.totalUsers || 0}
            subtitle={`+${stats?.newUsersThisWeek || 0} this week`}
            icon={Users} color="primary" loading={loading} />
          <StatCard title="Est. Revenue" value={loading ? 0 : `$${revenue.toFixed(0)}/mo`}
            subtitle={`${paidUsers} paid users`}
            icon={TrendingUp} color="success" loading={loading} />
          <StatCard title="Open Tickets" value={stats?.openTickets || 0}
            subtitle="Awaiting response" icon={HelpCircle} color="warning" loading={loading} />
          <StatCard title="New Feedback" value={stats?.newFeedback || 0}
            subtitle="Unreviewed" icon={MessageSquare} color="neutral" loading={loading} />
        </Stack>

        {/* Two Column Layout */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
          {/* Left Column */}
          <Stack spacing={2.5} sx={{ flex: 1.2 }}>
            {/* Plan Distribution */}
            <Card sx={{ ...adminCard as Record<string, unknown> }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CreditCard size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="title-md" fontWeight={700}>Plan Distribution</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{total} total</Typography>
                  </Box>
                  <Button size="sm" variant="plain" endDecorator={<ArrowUpRight size={12} />}
                    onClick={() => router.push('/admin/subscriptions')}>Details</Button>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {[
                    { label: 'Free', count: dist.free, color: 'neutral' as const },
                    { label: 'Pro', count: dist.pro, color: 'primary' as const },
                    { label: 'Max', count: dist.max, color: 'success' as const },
                  ].map(plan => (
                    <Card key={plan.label} sx={{ ...liquidGlassSubtle as Record<string, unknown>, flex: 1, textAlign: 'center', p: 2.5 }}>
                      {loading ? (
                        <>
                          <Skeleton variant="text" width={60} sx={{ fontSize: '1.75rem', mx: 'auto' }} />
                          <Skeleton variant="text" width={40} sx={{ mx: 'auto', mt: 0.5 }} />
                        </>
                      ) : (
                        <>
                          <Typography level="h3" fontWeight={700}>{plan.count}</Typography>
                          <Chip size="sm" variant="soft" color={plan.color} sx={{ mx: 'auto', mt: 0.5 }}>{plan.label}</Chip>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                            {total ? `${((plan.count / total) * 100).toFixed(0)}%` : '0%'}
                          </Typography>
                        </>
                      )}
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Box>
              <Typography level="title-md" fontWeight={700} sx={{ mb: 1.5 }}>Quick Actions</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {QUICK_ACTIONS.map(link => {
                  const Icon = link.icon;
                  return (
                    <Card key={link.label} sx={{
                      ...adminCard as Record<string, unknown>,
                      flex: '1 1 calc(50% - 8px)', minWidth: 200, cursor: 'pointer',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      '&:hover': { borderColor: `${link.color}.300`, boxShadow: 'sm' },
                    }} onClick={() => router.push(link.href)}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            width: 36, height: 36, borderRadius: 'md', bgcolor: `${link.color}.softBg`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Icon size={16} style={{ color: `var(--joy-palette-${link.color}-500)` }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={600}>{link.label}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>{link.desc}</Typography>
                          </Box>
                          <ArrowUpRight size={12} style={{ color: 'var(--joy-palette-neutral-400)', flexShrink: 0 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          </Stack>

          {/* Right Column */}
          <Stack spacing={2.5} sx={{ flex: 0.8, minWidth: 280 }}>
            {/* Recent Users */}
            <Card sx={{ ...adminCard as Record<string, unknown> }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <UserPlus size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="title-sm" fontWeight={700}>Recent Signups</Typography>
                  </Box>
                  <Button size="sm" variant="plain" endDecorator={<ArrowUpRight size={12} />}
                    onClick={() => router.push('/admin/users')}>All</Button>
                </Stack>
                <Stack spacing={0.5}>
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75 }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      </Stack>
                    ))
                  ) : stats?.recentUsers?.length ? (
                    stats.recentUsers.slice(0, 6).map(user => (
                      <Stack key={user.id} direction="row" spacing={1.5} alignItems="center"
                        sx={{ py: 0.75, px: 1, borderRadius: 'sm', cursor: 'pointer', '&:hover': { bgcolor: 'background.level1' } }}
                        onClick={() => router.push(`/admin/users/${user.id}`)}>
                        <Avatar src={user.photoURL || undefined} size="sm" sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography level="body-xs" fontWeight={600} noWrap>{user.name || 'Unnamed'}</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }} noWrap>{user.email}</Typography>
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', flexShrink: 0 }}>
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 2 }}>
                      No recent signups.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card sx={{ ...adminCard as Record<string, unknown> }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Activity size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="title-sm" fontWeight={700}>Recent Activity</Typography>
                  </Box>
                  <Button size="sm" variant="plain" endDecorator={<ArrowUpRight size={12} />}
                    onClick={() => router.push('/admin/activity')}>All</Button>
                </Stack>
                <Stack spacing={0.5}>
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75 }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width="80%" sx={{ flex: 1 }} />
                      </Stack>
                    ))
                  ) : stats?.recentActivity?.length ? (
                    stats.recentActivity.slice(0, 8).map((act, i) => {
                      const actType = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.system;
                      const ActIcon = actType.icon;
                      return (
                        <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5, px: 1 }}>
                          <Box sx={{
                            width: 24, height: 24, borderRadius: '50%', bgcolor: 'background.level1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <ActIcon size={11} style={{ color: actType.color }} />
                          </Box>
                          <Typography level="body-xs" sx={{ flex: 1, color: 'text.secondary' }} noWrap>
                            {act.description}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', flexShrink: 0 }}>
                            {formatDate(act.timestamp)}
                          </Typography>
                        </Stack>
                      );
                    })
                  ) : (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 2 }}>
                      No recent activity.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
