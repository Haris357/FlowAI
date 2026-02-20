'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Skeleton, Avatar,
} from '@mui/joy';
import { Users } from 'lucide-react';
import UserTable from '@/components/admin/UserTable';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [planFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>Users</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Manage all registered users.
          </Typography>
        </Box>

        {loading && users.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              {/* Skeleton filter bar */}
              <Stack direction="row" spacing={2} sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 'sm' }} />
                <Skeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 'sm', flexShrink: 0 }} />
              </Stack>
              {/* Skeleton rows */}
              {[1, 2, 3, 4, 5].map(i => (
                <Stack key={i} direction="row" spacing={2} alignItems="center"
                  sx={{ px: 2.5, py: 1.5, borderBottom: i < 5 ? '1px solid' : undefined, borderColor: 'divider' }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="55%" sx={{ mt: 0.25 }} />
                  </Box>
                  <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 10 }} />
                  <Skeleton variant="text" width={80} />
                </Stack>
              ))}
            </CardContent>
          </Card>
        ) : (
          <UserTable
            users={users}
            search={search}
            onSearchChange={setSearch}
            planFilter={planFilter}
            onPlanFilterChange={setPlanFilter}
            onDelete={handleDelete}
          />
        )}
      </Stack>
    </Box>
  );
}
