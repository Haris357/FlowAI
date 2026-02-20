'use client';
import {
  Box, Typography, Stack, Table, Sheet, Chip, Avatar, IconButton,
  Input, Select, Option, Card, CardContent,
} from '@mui/joy';
import { Search, Eye, Trash2, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserRow {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
  createdAt?: any;
  subscription?: { planId?: string; status?: string } | null;
}

interface UserTableProps {
  users: UserRow[];
  search: string;
  onSearchChange: (v: string) => void;
  planFilter: string;
  onPlanFilterChange: (v: string) => void;
  onDelete: (userId: string) => void;
}

const PLAN_COLORS: Record<string, 'neutral' | 'primary' | 'success'> = {
  free: 'neutral', pro: 'primary', max: 'success',
};

export default function UserTable({ users, search, onSearchChange, planFilter, onPlanFilterChange, onDelete }: UserTableProps) {
  const router = useRouter();

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
          sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            startDecorator={<Search size={16} />}
            sx={{ flex: 1 }}
            size="sm"
          />
          <Select
            value={planFilter}
            onChange={(_, v) => onPlanFilterChange(v || '')}
            placeholder="All Plans"
            sx={{ minWidth: 140 }}
            size="sm"
          >
            <Option value="">All Plans</Option>
            <Option value="free">Free</Option>
            <Option value="pro">Pro</Option>
            <Option value="max">Max</Option>
          </Select>
        </Stack>

        {/* Table */}
        {users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Inbox size={32} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
              No users found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflow: 'auto' }}>
            <Table size="sm" sx={{
              '& th': {
                bgcolor: 'background.level1', fontWeight: 600, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.tertiary',
                py: 1.25, px: 2.5,
              },
              '& td': { py: 1.5, px: 2.5, verticalAlign: 'middle' },
              '& tbody tr': {
                transition: 'background 0.15s',
                '&:hover': { bgcolor: 'background.level1' },
              },
            }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const plan = user.subscription?.planId || 'free';
                  return (
                    <tr key={user.id}>
                      <td>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={user.photoURL || undefined} size="sm" sx={{ width: 32, height: 32 }}>
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={600} noWrap>
                              {user.name || 'Unnamed'}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                              {user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </td>
                      <td>
                        <Chip size="sm" variant="soft" color={PLAN_COLORS[plan] || 'neutral'} sx={{ fontSize: '10px', textTransform: 'capitalize' }}>
                          {plan}
                        </Chip>
                      </td>
                      <td>
                        <Chip size="sm" variant="soft" color={
                          user.subscription?.status === 'active' ? 'success'
                          : user.subscription?.status === 'cancelled' ? 'warning'
                          : 'neutral'
                        } sx={{ fontSize: '10px' }}>
                          {user.subscription?.status || 'active'}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {formatDate(user.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="sm" variant="plain" onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <Eye size={14} />
                          </IconButton>
                          <IconButton size="sm" variant="plain" color="danger" onClick={() => onDelete(user.id)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </Stack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
