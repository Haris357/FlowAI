'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Skeleton, Divider,
} from '@mui/joy';
import { CreditCard, TrendingUp, Users } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { PLANS } from '@/lib/plans';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CreditCard size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
          </Box>
          <Box>
            <Typography level="h3" fontWeight={700}>Subscriptions</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Subscription analytics and revenue overview.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <StatCard title="Total Subscribers" value={total} icon={Users} color="primary" loading={loading} />
          <StatCard title="Est. Monthly Revenue" value={`$${revenue.toFixed(0)}`} icon={TrendingUp} color="success" loading={loading} />
          <StatCard title="Paid Users" value={dist.pro + dist.max} subtitle={total ? `${(((dist.pro + dist.max) / total) * 100).toFixed(0)}% conversion` : '0%'} icon={CreditCard} color="warning" loading={loading} />
        </Stack>

        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CreditCard size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Plan Distribution</Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {[
                { label: 'Free', price: `$${PLANS.free.price}`, count: dist.free, color: 'neutral' as const },
                { label: 'Pro', price: `$${PLANS.pro.price}/mo`, count: dist.pro, color: 'primary' as const },
                { label: 'Max', price: `$${PLANS.max.price}/mo`, count: dist.max, color: 'success' as const },
              ].map(plan => (
                <Card key={plan.label} sx={{ ...liquidGlassSubtle as Record<string, unknown>, flex: 1, textAlign: 'center', p: 3 }}>
                  {loading ? (
                    <>
                      <Skeleton variant="text" width={50} sx={{ fontSize: '1.75rem', mx: 'auto' }} />
                      <Skeleton variant="text" width={60} sx={{ mx: 'auto', mt: 0.5 }} />
                      <Skeleton variant="text" width={80} sx={{ mx: 'auto', mt: 0.5 }} />
                    </>
                  ) : (
                    <>
                      <Typography level="h3" fontWeight={700}>{plan.count}</Typography>
                      <Chip size="sm" variant="soft" color={plan.color} sx={{ mx: 'auto', mt: 0.5 }}>
                        {plan.label}
                      </Chip>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {plan.price}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {total ? `${((plan.count / total) * 100).toFixed(0)}%` : '0%'} of users
                      </Typography>
                    </>
                  )}
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
