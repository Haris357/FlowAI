'use client';
import { Box, CircularProgress, Typography, Stack } from '@mui/joy';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.body',
          zIndex: 9999,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size="lg" />
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            {message}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
