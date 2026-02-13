'use client';

import { Box, Stack, Typography } from '@mui/joy';
import AnimatedLogo from './AnimatedLogo';
import { BRAND_COLORS } from '@/styles/colors';

interface ChatWelcomeProps {
  userName?: string;
}

export default function ChatWelcome({ userName }: ChatWelcomeProps) {
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <Stack
      spacing={2}
      alignItems="center"
      sx={{ textAlign: 'center', mb: 4 }}
    >
      <AnimatedLogo size="md" />
      <Typography
        level="h2"
        sx={{
          fontWeight: 600,
          background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Welcome back, {firstName}!
      </Typography>
    </Stack>
  );
}
