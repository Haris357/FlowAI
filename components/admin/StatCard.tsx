'use client';
import { Card, CardContent, Typography, Stack, Box, Skeleton } from '@mui/joy';
import { adminCard } from '@/lib/admin-theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  loading?: boolean;
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', loading = false }: StatCardProps) {
  return (
    <Card
      sx={{
        ...adminCard as Record<string, unknown>,
        flex: 1,
        minWidth: 150,
        borderLeft: '3px solid',
        borderLeftColor: `${color}.400`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.05em',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} sx={{ fontSize: '1.75rem' }} />
            ) : (
              <Typography level="h3" fontWeight={700}>{value}</Typography>
            )}
            {subtitle && (
              loading ? (
                <Skeleton variant="text" width={100} sx={{ mt: 0.5 }} />
              ) : (
                <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )
            )}
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 'md',
              bgcolor: `${color}.softBg`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} style={{ color: `var(--joy-palette-${color}-500)` }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
