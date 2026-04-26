'use client';
import { Box, Card, CardContent, Stack, Grid, Skeleton } from '@mui/joy';

/**
 * Skeleton placeholder for the companies page list while data is loading.
 * Mirrors the editorial header + grid card layout so the page doesn't jump
 * once data arrives.
 */
export default function CompaniesSkeleton() {
  return (
    <Stack spacing={3}>
      {/* Editorial heading */}
      <Box sx={{ pt: { xs: 0.5, md: 1.5 }, pb: 0.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 1.75, sm: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" level="body-xs" width={70} sx={{ mb: 0.75 }} />
            <Skeleton
              variant="text"
              width="42%"
              sx={{
                fontSize: { xs: '1.55rem', sm: '1.75rem', md: '1.95rem' },
                mb: 0.75,
                borderRadius: 'sm',
              }}
            />
            <Skeleton variant="text" level="body-sm" width="28%" />
          </Box>
          <Skeleton
            variant="rectangular"
            width={132}
            height={32}
            sx={{ borderRadius: '999px', flexShrink: 0 }}
          />
        </Stack>
      </Box>

      {/* Search + view toggle */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <Skeleton variant="rectangular" height={32} sx={{ borderRadius: '999px', width: '100%' }} />
        </Box>
        <Stack direction="row" spacing={0.25}>
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={32} height={32} sx={{ borderRadius: '10px' }} />
          ))}
        </Stack>
      </Stack>

      {/* Card grid */}
      <Grid container spacing={2}>
        {[...Array(6)].map((_, i) => (
          <Grid key={i} xs={12} sm={6} md={4}>
            <Card
              variant="plain"
              sx={{
                background: 'var(--joy-palette-background-surface)',
                border: '1px solid',
                borderColor: 'var(--joy-palette-divider)',
                borderRadius: '14px',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2.25 }}>
                <Stack spacing={1.5}>
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Skeleton variant="circular" width={38} height={38} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>

                  {/* Title + subtitle */}
                  <Box>
                    <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.25 }} width="68%" />
                    <Skeleton variant="text" level="body-xs" width="50%" />
                  </Box>

                  {/* Description (2 lines) */}
                  <Box>
                    <Skeleton variant="text" level="body-xs" width="100%" />
                    <Skeleton variant="text" level="body-xs" width="80%" />
                  </Box>

                  {/* Footer */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 0.25, pt: 1.25, borderTop: '1px solid', borderColor: 'var(--joy-palette-divider)' }}
                  >
                    <Skeleton variant="text" level="body-xs" width={80} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
