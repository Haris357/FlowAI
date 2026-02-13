'use client';
import React from 'react';
import { Box, Card, CardContent, Stack, Skeleton, Container, Grid, Sheet } from '@mui/joy';

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header Skeleton */}
        <Box>
          <Skeleton variant="text" level="h2" width="40%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Box>

        {/* Stats Grid Skeleton */}
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid key={index} xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" level="h3" width="80%" />
                      <Skeleton variant="text" width="50%" />
                      <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 'sm' }} />
                    </Stack>
                    <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 'sm' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Table Skeleton */}
        <Card>
          <CardContent>
            <Skeleton variant="text" level="title-md" width="30%" sx={{ mb: 2 }} />
            <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2 }}>
              <Stack spacing={2}>
                {[...Array(5)].map((_, index) => (
                  <Stack key={index} direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="rectangular" width={80} height={20} />
                    <Skeleton variant="rectangular" width="100%" height={20} />
                    <Skeleton variant="rectangular" width={100} height={20} />
                    <Skeleton variant="rectangular" width={80} height={20} />
                    <Skeleton variant="rectangular" width={100} height={20} />
                  </Stack>
                ))}
              </Stack>
            </Sheet>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

// List Page Skeleton (for invoices, bills, customers, etc.)
export function ListPageSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" level="h2" width="40%" sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="60%" />
          </Box>
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 'sm' }} />
        </Stack>

        {/* Search and Filters */}
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 'sm' }} />
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid key={index} xs={12} sm={6} md={3}>
              <Card variant="soft">
                <CardContent>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" level="h3" width="50%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Content */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Stack spacing={0}>
              {[...Array(8)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderBottom: index < 7 ? '1px solid' : undefined,
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 'sm' }} />
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Stack>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 'sm' }} />
                    <Skeleton variant="rectangular" width={100} height={20} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={2}>
      {[...Array(rows)].map((_, index) => (
        <Stack key={index} direction="row" spacing={2} alignItems="center">
          <Skeleton variant="rectangular" width={60} height={20} />
          <Skeleton variant="rectangular" width="100%" height={20} />
          <Skeleton variant="rectangular" width={100} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
        </Stack>
      ))}
    </Stack>
  );
}

// Card Grid Skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={2}>
      {[...Array(count)].map((_, index) => (
        <Grid key={index} xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 'sm' }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 'sm' }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 'sm' }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Reports Page Skeleton
export function ReportsPageSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Skeleton variant="text" level="h2" width="30%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="50%" />
        </Box>

        {/* Date Range */}
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 'sm' }} />
        </Stack>

        {/* Report Cards */}
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid key={index} xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Skeleton variant="text" level="title-md" width="70%" sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    {[...Array(5)].map((_, i) => (
                      <Stack key={i} direction="row" justifyContent="space-between">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="30%" />
                      </Stack>
                    ))}
                  </Stack>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="30%" />
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

// Settings Page Skeleton
export function SettingsPageSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Skeleton variant="text" level="h2" width="30%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="50%" />
        </Box>

        {/* Settings Sections */}
        {[...Array(3)].map((_, sectionIndex) => (
          <Card key={sectionIndex} variant="outlined">
            <CardContent>
              <Skeleton variant="text" level="title-md" width="40%" sx={{ mb: 3 }} />
              <Stack spacing={3}>
                {[...Array(4)].map((_, fieldIndex) => (
                  <Stack key={fieldIndex} spacing={1}>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 'sm' }} />
                  </Stack>
                ))}
              </Stack>
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 'sm' }} />
                  <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 'sm' }} />
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

// Fullscreen Loading Skeleton (for initial page load)
export function FullscreenLoadingSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.body',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 'lg' }} />
          <Skeleton variant="text" level="h2" width={200} />
        </Stack>
        <Skeleton variant="text" width={300} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width={400} height={4} sx={{ borderRadius: 'sm' }} />
        </Box>
      </Stack>
    </Box>
  );
}
