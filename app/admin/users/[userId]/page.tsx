'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Avatar, Chip, Button, Divider,
  FormControl, FormLabel, Input, Select, Option, Skeleton, LinearProgress,
  Table, Sheet, IconButton, Tooltip,
} from '@mui/joy';
import {
  ArrowLeft, Mail, Zap, CreditCard, HelpCircle, Trash2, Calendar, Building2,
  Shield, ShieldCheck, ShieldAlert, Globe, Clock, User, Bell, MessageSquare,
  Copy, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle, Info,
  Coins, Receipt, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import SendEmailModal from '@/components/admin/SendEmailModal';
import toast from 'react-hot-toast';

const PLAN_COLORS: Record<string, 'neutral' | 'primary' | 'success'> = {
  free: 'neutral', pro: 'primary', max: 'success',
};

const PLAN_TOKENS: Record<string, number> = {
  free: 50_000, pro: 500_000, max: 2_000_000,
};

const TICKET_STATUS_COLORS: Record<string, 'warning' | 'success' | 'neutral' | 'primary'> = {
  open: 'warning', in_progress: 'primary', resolved: 'success', closed: 'neutral',
};

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{
        width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Typography level="title-sm" fontWeight={700}>{title}</Typography>
      {count !== undefined && (
        <Chip size="sm" variant="soft" color="neutral">{count}</Chip>
      )}
    </Stack>
  );
}

function InfoRow({ label, value, copyable, mono }: { label: string; value: string; copyable?: boolean; mono?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography level="body-xs" sx={{ color: 'text.tertiary', minWidth: 120 }}>{label}</Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography level="body-xs" fontWeight={500} sx={{
          color: 'text.secondary',
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: mono ? '11px' : undefined,
          maxWidth: 280,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {value}
        </Typography>
        {copyable && (
          <IconButton size="sm" variant="plain" sx={{ '--IconButton-size': '20px' }}
            onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied'); }}>
            <Copy size={10} />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [grantTokens, setGrantTokens] = useState('');
  const [grantingTokens, setGrantingTokens] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setNewPlan(d.subscription?.planId || 'free');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [userId]);

  const handleGrantTokens = async () => {
    const amount = parseInt(grantTokens);
    if (!amount || amount <= 0) { toast.error('Enter a valid token amount'); return; }
    setGrantingTokens(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: amount }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Granted ${amount.toLocaleString()} tokens`);
      setGrantTokens('');
      fetchData();
    } catch { toast.error('Failed to grant tokens'); }
    finally { setGrantingTokens(false); }
  };

  const handleChangePlan = async () => {
    setChangingPlan(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: newPlan }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Plan changed to ${newPlan}`);
      fetchData();
    } catch { toast.error('Failed to change plan'); }
    finally { setChangingPlan(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('User deleted');
      router.push('/admin/users');
    } catch { toast.error('Failed to delete user'); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    let d: Date;
    if (ts._seconds) d = new Date(ts._seconds * 1000);
    else if (typeof ts === 'string') d = new Date(ts);
    else d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return '-';
    let d: Date;
    if (ts._seconds) d = new Date(ts._seconds * 1000);
    else if (typeof ts === 'string') d = new Date(ts);
    else d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  };

  const timeAgo = (ts: any) => {
    if (!ts) return '';
    let d: Date;
    if (ts._seconds) d = new Date(ts._seconds * 1000);
    else if (typeof ts === 'string') d = new Date(ts);
    else d = new Date(ts);
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(ts);
  };

  const user = data?.user;
  const sub = data?.subscription;
  const plan = sub?.planId || 'free';
  const usage = data?.usage;
  const authInfo = data?.authInfo;

  const tokenAllocation = PLAN_TOKENS[plan] || 50_000;
  const tokensUsed = usage?.tokensUsed || 0;
  const bonusTokens = usage?.bonusTokens || 0;
  const tokensRemaining = Math.max(0, tokenAllocation - tokensUsed) + bonusTokens;
  const usagePercent = tokenAllocation > 0 ? Math.min(100, (tokensUsed / tokenAllocation) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={40} width={120} sx={{ borderRadius: 'sm' }} />
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={3}>
                <Skeleton variant="circular" width={80} height={80} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" sx={{ fontSize: '1.5rem' }} />
                  <Skeleton variant="text" width="55%" sx={{ mt: 0.5 }} />
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 10 }} />
                    <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 10 }} />
                    <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 10 }} />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 'md' }} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Back + Refresh */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button variant="plain" size="sm" startDecorator={<ArrowLeft size={14} />}
            onClick={() => router.push('/admin/users')} sx={{ color: 'text.secondary' }}>
            Back to Users
          </Button>
          <Button variant="plain" size="sm" startDecorator={<RefreshCw size={14} />}
            onClick={fetchData} sx={{ color: 'text.secondary' }}>
            Refresh
          </Button>
        </Stack>

        {/* ===== USER HEADER ===== */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
              <Avatar src={user?.photoURL || undefined} sx={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography level="h4" fontWeight={700}>{user?.name || 'Unnamed User'}</Typography>
                  {authInfo?.emailVerified ? (
                    <Tooltip title="Email verified">
                      <Box><ShieldCheck size={16} style={{ color: 'var(--joy-palette-success-500)' }} /></Box>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Email not verified">
                      <Box><ShieldAlert size={16} style={{ color: 'var(--joy-palette-warning-500)' }} /></Box>
                    </Tooltip>
                  )}
                  {authInfo?.disabled && (
                    <Chip size="sm" variant="soft" color="danger">Disabled</Chip>
                  )}
                </Stack>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>{user?.email}</Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                  <Chip size="sm" variant="soft" color={PLAN_COLORS[plan]} sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {plan} Plan
                  </Chip>
                  <Chip size="sm" variant="soft" color="neutral" startDecorator={<Building2 size={10} />}>
                    {data?.companiesCount || 0} {(data?.companiesCount || 0) === 1 ? 'company' : 'companies'}
                  </Chip>
                  <Chip size="sm" variant="soft" color="neutral" startDecorator={<Calendar size={10} />}>
                    Joined {formatDate(user?.createdAt)}
                  </Chip>
                  {authInfo?.providers?.map((p: string) => (
                    <Chip key={p} size="sm" variant="outlined" color="neutral" startDecorator={
                      p === 'google.com' ? <Globe size={10} /> : <Mail size={10} />
                    }>
                      {p === 'google.com' ? 'Google' : p === 'password' ? 'Email/Pass' : p}
                    </Chip>
                  ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="sm" variant="soft" startDecorator={<Mail size={14} />}
                  onClick={() => setEmailModalOpen(true)}>Email</Button>
                <Button size="sm" variant="soft" color="danger" startDecorator={<Trash2 size={14} />}
                  onClick={handleDelete}>Delete</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* ===== QUICK STATS ROW ===== */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {[
            { label: 'Tokens Used', value: formatTokens(tokensUsed), sub: `of ${formatTokens(tokenAllocation)}`, color: '#D97757' },
            { label: 'Tokens Remaining', value: formatTokens(tokensRemaining), sub: bonusTokens > 0 ? `+${formatTokens(bonusTokens)} bonus` : 'this period', color: '#22c55e' },
            { label: 'Support Tickets', value: String(data?.tickets?.length || 0), sub: `${data?.tickets?.filter((t: any) => t.status === 'open')?.length || 0} open`, color: '#f59e0b' },
            { label: 'Last Sign In', value: authInfo?.lastSignIn ? timeAgo(authInfo.lastSignIn) : '-', sub: authInfo?.lastSignIn ? formatDate(authInfo.lastSignIn) : 'Never', color: '#6366f1' },
          ].map((stat, i) => (
            <Card key={i} variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>{stat.label}</Typography>
                <Typography level="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{stat.sub}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* ===== TWO-COLUMN LAYOUT ===== */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* LEFT COLUMN */}
          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>

            {/* ACCOUNT DETAILS */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<User size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />} title="Account Details" />
                <Divider sx={{ my: 2 }} />
                <Stack spacing={0}>
                  <InfoRow label="User ID" value={userId} copyable mono />
                  <InfoRow label="Display Name" value={user?.name || '-'} />
                  <InfoRow label="Email" value={user?.email || '-'} copyable />
                  <InfoRow label="Email Verified" value={authInfo?.emailVerified ? 'Yes' : 'No'} />
                  <InfoRow label="Auth Provider" value={authInfo?.providers?.map((p: string) =>
                    p === 'google.com' ? 'Google' : p === 'password' ? 'Email/Password' : p
                  ).join(', ') || '-'} />
                  <InfoRow label="Account Created" value={authInfo?.creationTime ? formatDateTime(authInfo.creationTime) : formatDate(user?.createdAt)} />
                  <InfoRow label="Last Sign In" value={authInfo?.lastSignIn ? formatDateTime(authInfo.lastSignIn) : '-'} />
                  <InfoRow label="Last Refresh" value={authInfo?.lastRefreshTime ? formatDateTime(authInfo.lastRefreshTime) : '-'} />
                  <InfoRow label="Account Status" value={authInfo?.disabled ? 'Disabled' : 'Active'} />
                </Stack>
              </CardContent>
            </Card>

            {/* AI USAGE */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Zap size={16} style={{ color: '#D97757' }} />} title="AI Token Usage" />
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                  Period: {data?.usagePeriod || '-'}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography level="body-xs" fontWeight={600}>
                      {formatTokens(tokensUsed)} / {formatTokens(tokenAllocation)} tokens used
                    </Typography>
                    <Typography level="body-xs" fontWeight={600} sx={{ color: usagePercent > 90 ? 'danger.500' : usagePercent > 70 ? 'warning.500' : 'success.500' }}>
                      {usagePercent.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    determinate value={usagePercent} size="lg"
                    sx={{
                      '--LinearProgress-radius': '8px',
                      '--LinearProgress-thickness': '12px',
                      bgcolor: 'neutral.100',
                      [`& .MuiLinearProgress-bar`]: {
                        bgcolor: usagePercent > 90 ? 'danger.500' : usagePercent > 70 ? 'warning.500' : '#D97757',
                      },
                    }}
                  />
                </Box>

                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {[
                    { label: 'Used', value: tokensUsed.toLocaleString(), color: 'text.secondary' },
                    { label: 'Monthly Limit', value: tokenAllocation.toLocaleString(), color: 'text.secondary' },
                    { label: 'Bonus', value: bonusTokens.toLocaleString(), color: 'success.500' },
                    { label: 'Remaining', value: tokensRemaining.toLocaleString(), color: '#D97757' },
                    { label: 'Requests', value: String(usage?.requestCount || 0), color: 'text.secondary' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ minWidth: 100 }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{item.label}</Typography>
                      <Typography level="body-sm" fontWeight={600} sx={{ color: item.color }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* COMPANIES LIST */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Building2 size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />} title="Companies" count={data?.companies?.length || 0} />
                <Divider sx={{ my: 2 }} />
                {data?.companies?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {(showAllCompanies ? data.companies : data.companies.slice(0, 3)).map((company: any) => (
                      <Card key={company.id} variant="soft" sx={{ p: 0 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography level="body-sm" fontWeight={600}>{company.name}</Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary', textTransform: 'capitalize' }}>
                                  {company.businessType || '-'}
                                </Typography>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {company.country || '-'}
                                </Typography>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {company.currency || '-'}
                                </Typography>
                              </Stack>
                            </Box>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', flexShrink: 0 }}>
                              {formatDate(company.createdAt)}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                    {data.companies.length > 3 && (
                      <Button variant="plain" size="sm" sx={{ alignSelf: 'flex-start' }}
                        endDecorator={showAllCompanies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        onClick={() => setShowAllCompanies(!showAllCompanies)}>
                        {showAllCompanies ? 'Show less' : `Show all ${data.companies.length}`}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 3 }}>
                    No companies created
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* SUPPORT TICKETS */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<HelpCircle size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />} title="Support Tickets" count={data?.tickets?.length || 0} />
                <Divider sx={{ my: 2 }} />
                {data?.tickets?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {(showAllTickets ? data.tickets : data.tickets.slice(0, 3)).map((ticket: any) => (
                      <Card key={ticket.id} variant="soft" sx={{ p: 0 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography level="body-sm" fontWeight={600}>{ticket.subject || 'No subject'}</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                                {ticket.description?.slice(0, 120)}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {formatDate(ticket.createdAt)}
                                </Typography>
                                {ticket.category && (
                                  <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
                                    {ticket.category}
                                  </Chip>
                                )}
                                {ticket.priority && (
                                  <Chip size="sm" variant="outlined" color={
                                    ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'neutral'
                                  } sx={{ fontSize: '10px', '--Chip-minHeight': '18px' }}>
                                    {ticket.priority}
                                  </Chip>
                                )}
                              </Stack>
                            </Box>
                            <Chip size="sm" variant="soft" color={TICKET_STATUS_COLORS[ticket.status] || 'neutral'}
                              sx={{ fontSize: '10px', flexShrink: 0 }}>
                              {ticket.status}
                            </Chip>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                    {data.tickets.length > 3 && (
                      <Button variant="plain" size="sm" sx={{ alignSelf: 'flex-start' }}
                        endDecorator={showAllTickets ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        onClick={() => setShowAllTickets(!showAllTickets)}>
                        {showAllTickets ? 'Show less' : `Show all ${data.tickets.length}`}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 3 }}>
                    No support tickets
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>

          {/* RIGHT COLUMN */}
          <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>

            {/* SUBSCRIPTION MANAGEMENT */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<CreditCard size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />} title="Subscription" />
                <Divider sx={{ my: 2 }} />

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <InfoRow label="Current Plan" value={`${plan.charAt(0).toUpperCase() + plan.slice(1)} ($${plan === 'free' ? '0' : plan === 'pro' ? '29.99' : '99.99'}/mo)`} />
                  <InfoRow label="Status" value={sub?.status || 'active'} />
                  <InfoRow label="Period Start" value={formatDate(sub?.currentPeriodStart)} />
                  <InfoRow label="Period End" value={formatDate(sub?.currentPeriodEnd)} />
                  {sub?.cancelAt && <InfoRow label="Cancels At" value={formatDate(sub.cancelAt)} />}
                  {sub?.adminOverride && <InfoRow label="Admin Override" value="Yes" />}
                  {sub?.lemonSqueezySubscriptionId && (
                    <InfoRow label="LS Sub ID" value={sub.lemonSqueezySubscriptionId} copyable mono />
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography level="body-xs" fontWeight={600} sx={{ mb: 1 }}>Change Plan</Typography>
                <Stack spacing={1.5}>
                  <Select value={newPlan} onChange={(_, v) => v && setNewPlan(v)} size="sm">
                    <Option value="free">Free ($0/mo)</Option>
                    <Option value="pro">Pro ($29.99/mo)</Option>
                    <Option value="max">Max ($99.99/mo)</Option>
                  </Select>
                  <Button size="sm" onClick={handleChangePlan} loading={changingPlan} disabled={newPlan === plan}
                    fullWidth>
                    Update Plan
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* GRANT TOKENS */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Coins size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />} title="Grant Tokens" />
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <FormControl size="sm">
                    <FormLabel>Token Amount</FormLabel>
                    <Input type="number" size="sm" value={grantTokens}
                      onChange={(e) => setGrantTokens(e.target.value)} placeholder="e.g., 50000" />
                  </FormControl>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {[10000, 50000, 100000, 500000].map(amount => (
                      <Button key={amount} size="sm" variant="outlined" color="neutral"
                        sx={{ fontSize: '11px', minHeight: '28px', px: 1.5 }}
                        onClick={() => setGrantTokens(String(amount))}>
                        +{formatTokens(amount)}
                      </Button>
                    ))}
                  </Stack>
                  <Button size="sm" onClick={handleGrantTokens} loading={grantingTokens}
                    disabled={!grantTokens} color="warning" fullWidth>
                    Grant Tokens
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* RECENT NOTIFICATIONS */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Bell size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />} title="Notifications" count={data?.notifications?.length || 0} />
                <Divider sx={{ my: 2 }} />
                {data?.notifications?.length > 0 ? (
                  <Stack spacing={1}>
                    {(showAllNotifications ? data.notifications : data.notifications.slice(0, 5)).map((notif: any) => (
                      <Stack key={notif.id} direction="row" spacing={1} alignItems="flex-start" sx={{
                        py: 0.75, opacity: notif.read ? 0.6 : 1,
                      }}>
                        <Box sx={{ mt: 0.25 }}>
                          {notif.type === 'success' ? <CheckCircle size={12} style={{ color: 'var(--joy-palette-success-500)' }} /> :
                           notif.type === 'warning' ? <AlertTriangle size={12} style={{ color: 'var(--joy-palette-warning-500)' }} /> :
                           notif.type === 'action' ? <ExternalLink size={12} style={{ color: 'var(--joy-palette-primary-500)' }} /> :
                           <Info size={12} style={{ color: 'var(--joy-palette-neutral-500)' }} />}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography level="body-xs" fontWeight={600} noWrap>{notif.title}</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>{notif.message}</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
                            {timeAgo(notif.createdAt)}
                            {notif.read ? ' · Read' : ' · Unread'}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                    {data.notifications.length > 5 && (
                      <Button variant="plain" size="sm" sx={{ alignSelf: 'flex-start', fontSize: '11px' }}
                        endDecorator={showAllNotifications ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        onClick={() => setShowAllNotifications(!showAllNotifications)}>
                        {showAllNotifications ? 'Show less' : `Show all ${data.notifications.length}`}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', py: 2 }}>
                    No notifications
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* FEEDBACK */}
            {data?.feedback?.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <SectionHeader icon={<MessageSquare size={16} style={{ color: 'var(--joy-palette-success-500)' }} />} title="Feedback" count={data.feedback.length} />
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.5}>
                    {data.feedback.slice(0, 5).map((fb: any) => (
                      <Card key={fb.id} variant="soft" sx={{ p: 0 }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography level="body-xs" fontWeight={600}>{fb.subject || fb.type || 'Feedback'}</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                                {fb.description?.slice(0, 80)}
                              </Typography>
                            </Box>
                            <Chip size="sm" variant="soft" color={
                              fb.status === 'new' ? 'warning' : fb.status === 'acknowledged' ? 'success' : 'neutral'
                            } sx={{ fontSize: '10px', flexShrink: 0, ml: 1 }}>
                              {fb.status || 'new'}
                            </Chip>
                          </Stack>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', mt: 0.5 }}>
                            {formatDate(fb.createdAt)} · {fb.type || '-'}
                            {fb.rating ? ` · ${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}` : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* TOKEN PURCHASES */}
            {data?.tokenPurchases?.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <SectionHeader icon={<Receipt size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />} title="Token Purchases" count={data.tokenPurchases.length} />
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1}>
                    {data.tokenPurchases.slice(0, 5).map((purchase: any) => (
                      <Stack key={purchase.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Box>
                          <Typography level="body-xs" fontWeight={600}>
                            {formatTokens(purchase.tokensTotal || purchase.tokens || 0)} tokens
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
                            {formatDate(purchase.purchasedAt)}
                          </Typography>
                        </Box>
                        <Chip size="sm" variant="soft" color={purchase.status === 'completed' ? 'success' : 'neutral'}
                          sx={{ fontSize: '10px' }}>
                          {purchase.status || '-'}
                        </Chip>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* BILLING HISTORY */}
            {data?.billingHistory?.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <SectionHeader icon={<Receipt size={16} style={{ color: 'var(--joy-palette-neutral-500)' }} />} title="Billing History" count={data.billingHistory.length} />
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1}>
                    {data.billingHistory.slice(0, 5).map((event: any) => (
                      <Stack key={event.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Box>
                          <Typography level="body-xs" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                            {(event.type || event.eventType || '-').replace(/_/g, ' ')}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
                            {formatDate(event.createdAt)}
                          </Typography>
                        </Box>
                        {event.amount && (
                          <Typography level="body-xs" fontWeight={600}>
                            ${(event.amount / 100).toFixed(2)}
                          </Typography>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* DANGER ZONE */}
            <Card variant="outlined" color="danger">
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AlertTriangle size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
                  <Typography level="title-sm" fontWeight={700} sx={{ color: 'danger.500' }}>Danger Zone</Typography>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1.5 }}>
                  Permanently delete this user account. This action cannot be undone and will remove the user from Firebase Auth and Firestore.
                </Typography>
                <Button size="sm" color="danger" variant="soft" fullWidth
                  startDecorator={<Trash2 size={14} />} onClick={handleDelete}>
                  Delete User Account
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Stack>

      <SendEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        userId={userId}
        userEmail={user?.email || ''}
        userName={user?.name}
      />
    </Box>
  );
}
