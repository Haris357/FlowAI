'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Avatar, Button, Skeleton,
  Sheet, Table, IconButton, Tooltip, Select, Option, Input,
} from '@mui/joy';
import {
  Users, Eye, Trash2, Search, Filter, Inbox, RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

type PlanColor = 'neutral' | 'primary' | 'success';
const PLAN_COLORS: Record<string, PlanColor> = {
  free: 'neutral', pro: 'primary', max: 'success',
};

interface UserRow {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
  createdAt?: any;
  subscription?: { planId?: string; status?: string } | null;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate()
    : ts._seconds ? new Date(ts._seconds * 1000)
    : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    adminFetch('/api/admin/users?limit=500')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => toast.error('Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, planFilter, statusFilter, pageSize]);

  const confirmDelete = async () => {
    if (!deleteConfirm.user) return;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/users/${deleteConfirm.user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.user!.id));
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, user: null });
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const plan = u.subscription?.planId || 'free';
      const status = u.subscription?.status || 'active';
      if (planFilter && plan !== planFilter) return false;
      if (statusFilter && status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(u.name || '').toLowerCase().includes(q) &&
          !(u.email || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [users, search, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const planCounts = useMemo(() => {
    const map = { free: 0, pro: 0, max: 0 };
    users.forEach(u => {
      const p = (u.subscription?.planId || 'free') as keyof typeof map;
      if (map[p] !== undefined) map[p]++;
    });
    return map;
  }, [users]);

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Users size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Users</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {users.length} total · {planCounts.free} Free · {planCounts.pro} Pro · {planCounts.max} Max
              </Typography>
            </Box>
          </Stack>
          <Button
            size="sm" variant="outlined" color="neutral"
            startDecorator={<RefreshCw size={14} />}
            onClick={load} loading={loading}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filters</Typography>
              </Stack>
              <Input
                size="sm"
                placeholder="Search by name or email…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm" placeholder="All Plans" value={planFilter || ''}
                onChange={(_, v) => setPlanFilter(v || '')}
                sx={{ minWidth: 130, borderRadius: '8px' }}
              >
                <Option value="">All Plans</Option>
                <Option value="free">Free</Option>
                <Option value="pro">Pro</Option>
                <Option value="max">Max</Option>
              </Select>
              <Select
                size="sm" placeholder="All Statuses" value={statusFilter || ''}
                onChange={(_, v) => setStatusFilter(v || '')}
                sx={{ minWidth: 140, borderRadius: '8px' }}
              >
                <Option value="">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="past_due">Past Due</Option>
                <Option value="trialing">Trialing</Option>
              </Select>
              {(search || planFilter || statusFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setPlanFilter(''); setStatusFilter(''); }}
                >
                  Clear
                </Chip>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table hoverRow stickyHeader sx={{
              '& thead th': {
                py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                bgcolor: 'background.surface',
              },
              '& tbody td': { py: 1.5, verticalAlign: 'middle' },
              minWidth: 800,
            }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th style={{ width: '6rem' }}>Plan</th>
                  <th style={{ width: '7rem' }}>Status</th>
                  <th style={{ width: '7rem' }}>Joined</th>
                  <th style={{ width: '7rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="circular" width={32} height={32} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="text" width="55%" />
                          </Box>
                        </Stack>
                      </td>
                      <td><Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={55} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={50} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || planFilter || statusFilter ? 'No users match your filters.' : 'No users yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(u => {
                    const plan = u.subscription?.planId || 'free';
                    const status = u.subscription?.status || 'active';
                    const statusColor: 'success' | 'warning' | 'danger' | 'neutral' =
                      status === 'active' ? 'success'
                      : status === 'cancelled' ? 'warning'
                      : status === 'past_due' ? 'danger'
                      : 'neutral';
                    return (
                      <tr key={u.id}>
                        <td>
                          <Stack
                            direction="row" spacing={1.5} alignItems="center"
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <Avatar src={u.photoURL || undefined} size="sm" sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                              {(u.name || u.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography level="body-sm" fontWeight={600} noWrap>
                                {u.name || 'Unnamed'}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                                {u.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </td>
                        <td>
                          <Chip
                            size="sm" variant="soft"
                            color={PLAN_COLORS[plan] || 'neutral'}
                            sx={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}
                          >
                            {plan}
                          </Chip>
                        </td>
                        <td>
                          <Chip
                            size="sm" variant="soft" color={statusColor}
                            sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                          >
                            {status.replace(/_/g, ' ')}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {formatDate(u.createdAt)}
                          </Typography>
                        </td>
                        <td>
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                            <Tooltip title="View details">
                              <IconButton
                                size="sm" variant="plain" color="neutral"
                                onClick={() => router.push(`/admin/users/${u.id}`)}
                              >
                                <Eye size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete user">
                              <IconButton
                                size="sm" variant="plain" color="danger"
                                onClick={() => setDeleteConfirm({ open: true, user: u })}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Sheet>

          {!loading && filtered.length > 0 && (
            <PaginationFooter
              startIdx={startIdx} endIdx={endIdx} total={filtered.length}
              pageSize={pageSize} setPageSize={setPageSize}
              currentPage={currentPage} totalPages={totalPages} setPage={setPage}
            />
          )}
        </Card>
      </Stack>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, user: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        description={
          deleteConfirm.user
            ? `Permanently delete ${deleteConfirm.user.email || 'this user'}? This cannot be undone.`
            : 'Are you sure you want to delete this user? This action cannot be undone.'
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </Box>
  );
}
