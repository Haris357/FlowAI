'use client';

import { Box } from '@mui/joy';
import { keyframes } from '@emotion/react';
import { BRAND_COLORS, primaryPalette } from '@/styles/colors';

// Subtle pulse animation for when AI is responding
const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
`;

const glowAnimation = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(217, 119, 87, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(217, 119, 87, 0.5));
  }
`;

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  isResponding?: boolean;
}

export default function AnimatedLogo({ size = 'md', isResponding = false }: AnimatedLogoProps) {
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
  };

  const { width, height } = sizes[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        cursor: 'pointer',
        animation: isResponding
          ? `${pulseAnimation} 1.5s ease-in-out infinite, ${glowAnimation} 1.5s ease-in-out infinite`
          : 'none',
        transition: 'transform 0.2s ease, filter 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          filter: 'drop-shadow(0 0 10px rgba(217, 119, 87, 0.4))',
        },
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="url(#bgGradient)"
        />

        {/* Inner subtle ring */}
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* AI Spark/Star design - Claude-inspired */}
        <g transform="translate(32, 32)">
          {/* Center spark lines */}
          <line x1="0" y1="-14" x2="0" y2="-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="8" x2="0" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-14" y1="0" x2="-8" y2="0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="0" x2="14" y2="0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

          {/* Diagonal lines */}
          <line x1="-10" y1="-10" x2="-6" y2="-6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="6" y1="-6" x2="10" y2="-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="-10" y1="10" x2="-6" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="6" y1="6" x2="10" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

          {/* Center dot */}
          <circle cx="0" cy="0" r="3" fill="white" />
        </g>

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryPalette[400]} />
            <stop offset="50%" stopColor={BRAND_COLORS.primary} />
            <stop offset="100%" stopColor={BRAND_COLORS.secondary} />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}
